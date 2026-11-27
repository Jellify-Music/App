import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { create } from 'zustand'
import { fetchPlaylistArtists } from '../../api/queries/playlist/utils'
import usePlaylistArtistsStore, {
	clearPlaylistArtists,
	hydratePlaylistArtists,
	PlaylistArtistSummary,
} from '../../stores/playlist-artists'
import { summaryVersion } from '../../utils/artist-playlists'

/** How many playlists are read at once when working through a large library */
const WORKERS = 6

/** How often, at most, finished summaries are handed over to the store */
const HAND_OVER_INTERVAL = 250

/** What the indexer is up to, for showing to the user */
export const usePlaylistIndexStatus = create<{
	/** How many playlists couldn't be read, and are left until asked to try again */
	failed: number
}>(() => ({ failed: 0 }))

/** One stretch of indexing, from the first consumer arriving to the last one leaving */
interface Run {
	controller: AbortController
	/** Playlists still to be read */
	queue: BaseItemDto[]
	/** IDs of the playlists being read right now */
	inFlight: Set<string>
	/** IDs of the playlists that couldn't be read */
	failed: Set<string>
}

interface Request {
	playlists: BaseItemDto[]
	/** Whether the playlist lists loaded completely, so playlists missing from them are gone */
	listsComplete: boolean
}

const consumers = new Set<symbol>()

let request: Request | undefined
let run: Run | undefined
let unsaved: Record<string, PlaylistArtistSummary> = {}
let handOverTimer: ReturnType<typeof setTimeout> | undefined
let stopTimer: ReturnType<typeof setTimeout> | undefined

/** Hands the summaries finished so far to the store */
function handOver() {
	if (handOverTimer !== undefined) clearTimeout(handOverTimer)
	handOverTimer = undefined

	if (Object.keys(unsaved).length === 0) return

	usePlaylistArtistsStore.getState().updateSummaries(unsaved)
	unsaved = {}
}

/** Works out the artists on a playlist, and keeps the result */
async function read(current: Run, playlist: BaseItemDto) {
	const id = playlist.Id!
	const { signal } = current.controller

	current.inFlight.add(id)

	try {
		const { artistIds } = await fetchPlaylistArtists(playlist, signal)

		if (signal.aborted) return

		unsaved[id] = { version: summaryVersion(playlist), artistIds }

		handOverTimer ??= setTimeout(handOver, HAND_OVER_INTERVAL)
	} catch {
		if (signal.aborted) return

		current.failed.add(id)
		usePlaylistIndexStatus.setState({ failed: current.failed.size })
	} finally {
		current.inFlight.delete(id)

		if (run === current) pump()
	}
}

/** Having been through every playlist, forgets the summaries of those that no longer exist */
function finish(current: Run) {
	handOver()

	if (request?.listsComplete && current.failed.size === 0) {
		const existing = new Set(request.playlists.map((playlist) => playlist.Id))
		const gone = Object.keys(usePlaylistArtistsStore.getState().summaries).filter(
			(id) => !existing.has(id),
		)

		if (gone.length > 0) usePlaylistArtistsStore.getState().updateSummaries({}, gone)
	}
}

/** Keeps the workers busy until there's nothing left to read */
function pump() {
	const current = run

	if (!current) return

	while (current.inFlight.size < WORKERS && current.queue.length > 0)
		void read(current, current.queue.shift()!)

	if (current.inFlight.size === 0 && current.queue.length === 0) finish(current)
}

/** Queues whichever of the requested playlists don't have an up to date summary */
function plan() {
	if (!request) return

	run ??= {
		controller: new AbortController(),
		queue: [],
		inFlight: new Set(),
		failed: new Set(),
	}

	// Summaries finished but not yet handed over would be read again
	handOver()

	const current = run
	const { summaries } = usePlaylistArtistsStore.getState()

	current.queue = request.playlists.filter(
		(playlist) =>
			playlist.Id &&
			!current.inFlight.has(playlist.Id) &&
			!current.failed.has(playlist.Id) &&
			summaries[playlist.Id]?.version !== summaryVersion(playlist),
	)

	pump()
}

/** Stops reading playlists, keeping what's been read so far */
function stop() {
	run?.controller.abort()
	run = undefined

	handOver()

	usePlaylistIndexStatus.setState({ failed: 0 })
}

/**
 * Makes sure the given playlists get summarised (which artists are on them) for as long as the
 * caller keeps this going, and returns the function that lets go of it.
 *
 * All callers share one indexer: playlists are read once however many pages want them, a new set
 * of playlists replaces what's still queued without disturbing what's being read, and when the
 * last caller lets go the requests in flight are cancelled. The summaries are kept in
 * {@link usePlaylistArtistsStore}, so nothing is lost by stopping.
 *
 * @param playlists Every playlist there is, the user's and the public ones
 * @param listsComplete Whether `playlists` is the complete picture, rather than some of the lists
 * having failed to load, which decides if summaries of playlists missing from it are dropped
 */
export function startPlaylistIndexing(playlists: BaseItemDto[], listsComplete: boolean) {
	const token = Symbol('playlist indexing')

	consumers.add(token)

	if (stopTimer !== undefined) clearTimeout(stopTimer)
	stopTimer = undefined

	hydratePlaylistArtists()

	request = { playlists, listsComplete }
	plan()

	return () => {
		consumers.delete(token)

		// A consumer being replaced by another straight away shouldn't stop what's in flight
		stopTimer ??= setTimeout(() => {
			stopTimer = undefined

			if (consumers.size === 0) stop()
		}, 0)
	}
}

/** Tries again with the playlists that couldn't be read */
export function retryPlaylistIndexing() {
	run?.failed.clear()
	usePlaylistIndexStatus.setState({ failed: 0 })

	plan()
}

/**
 * Stops indexing and forgets everything learned, for when the user signs out. Anything still
 * using the indexer has gone by then, or is about to, and can start it again.
 */
export function resetPlaylistIndexing() {
	if (stopTimer !== undefined) clearTimeout(stopTimer)
	stopTimer = undefined

	consumers.clear()
	request = undefined
	unsaved = {}

	if (handOverTimer !== undefined) clearTimeout(handOverTimer)
	handOverTimer = undefined

	stop()
	clearPlaylistArtists()
}
