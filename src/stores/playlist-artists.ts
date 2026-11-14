import { create } from 'zustand'
import { storage } from '../constants/storage'

/** Which artists are on a playlist, as of a given version of that playlist */
export interface PlaylistArtistSummary {
	/** The playlist's version when it was summarised, see `playlistVersion` */
	version: string
	/** IDs of every track artist and album artist on the playlist */
	artistIds: string[]
}

type PlaylistArtistsStore = {
	/** A summary per playlist ID */
	summaries: Record<string, PlaylistArtistSummary>
	/** Adds or replaces summaries, and drops those of the given playlists */
	updateSummaries: (changes: Record<string, PlaylistArtistSummary>, removed?: string[]) => void
}

/**
 * Each summary is kept under a key of its own. Bumping the number in the prefix when the format
 * changes leaves summaries in the old format unread, so they're worked out again, which makes a
 * migration unnecessary.
 */
const KEY_PREFIX = 'playlist-artists/v1/'

const encode = ({ version, artistIds }: PlaylistArtistSummary) =>
	`${version}\n${artistIds.join(',')}`

const decode = (value: string): PlaylistArtistSummary | undefined => {
	const split = value.indexOf('\n')

	if (split < 1) return undefined

	const artistIds = value.slice(split + 1)

	return {
		version: value.slice(0, split),
		artistIds: artistIds ? artistIds.split(',') : [],
	}
}

/**
 * What we know about the artists on each playlist, so the artist page can list the playlists an
 * artist is on without looking inside every playlist each time.
 *
 * This is a store of its own, rather than part of the query cache, because a library can hold
 * thousands of playlists: the query cache is persisted whole, so every summary added to it would
 * re-save the entire cache, which includes the full lists of playlists. It isn't persisted as one
 * value either, which would mean writing every summary out again for each batch added; each
 * summary is saved on its own, so saving costs as much as what changed.
 *
 * Summaries are read from storage by {@link hydratePlaylistArtists}, when they're first needed
 * rather than when the app starts, as there can be thousands of them.
 */
const usePlaylistArtistsStore = create<PlaylistArtistsStore>()((set) => ({
	summaries: {},
	updateSummaries: (changes, removed = []) => {
		Object.entries(changes).forEach(([id, summary]) =>
			storage.set(KEY_PREFIX + id, encode(summary)),
		)
		removed.forEach((id) => storage.remove(KEY_PREFIX + id))

		set((state) => {
			const summaries = { ...state.summaries, ...changes }

			removed.forEach((id) => delete summaries[id])

			return { summaries }
		})
	},
}))

let hydrated = false

/** Reads the saved summaries into the store, once. Anything added in the meantime is kept. */
export function hydratePlaylistArtists() {
	if (hydrated) return

	hydrated = true

	const saved: Record<string, PlaylistArtistSummary> = {}

	for (const key of storage.getAllKeys()) {
		if (!key.startsWith(KEY_PREFIX)) continue

		const value = storage.getString(key)
		const summary = value === undefined ? undefined : decode(value)

		if (summary) saved[key.slice(KEY_PREFIX.length)] = summary
	}

	usePlaylistArtistsStore.setState((state) => ({ summaries: { ...saved, ...state.summaries } }))
}

/**
 * Forgets every summary, in memory and in storage, for when the user signs out: what's known about
 * their playlists shouldn't outlive their session, or leak into the next one.
 */
export function clearPlaylistArtists() {
	for (const key of storage.getAllKeys()) if (key.startsWith(KEY_PREFIX)) storage.remove(key)

	usePlaylistArtistsStore.setState({ summaries: {} })

	// whatever is in storage next time, which is nothing until something is saved, is current
	hydrated = false
}

export default usePlaylistArtistsStore
