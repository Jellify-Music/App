import type { QueuedDownload } from '../stores/download-queue'

/** A queued track that is neither done nor known to the downloader for this long is given up on */
export const STALE_AFTER_MS = 10 * 60 * 1000

/** One album's downloads, or a track's own when it has no album */
export interface DownloadGroup {
	key: string
	albumId?: string
	title: string
	artist?: string
	imageTag?: string
	/** Tracks queued for it */
	total: number
	/** Tracks that have finished */
	done: number
	/** 0 to 1: the tracks done, plus how far the running ones are */
	progress: number
	trackIds: string[]
	queuedAt: number
}

export interface GroupedDownloads {
	/** Albums that are still downloading, in the order they were queued */
	groups: DownloadGroup[]
	/** Entries to forget: ones that never got going, and every track of an album that has finished */
	forget: string[]
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Works out what is downloading from what was queued and what the downloader says is running.
 *
 * @param entries Everything queued, done or not
 * @param running The tracks the downloader has, with how far each is (0 to 1)
 * @param now The time, for telling which entries have been waiting too long
 */
export function groupDownloads(
	entries: QueuedDownload[],
	running: ReadonlyMap<string, number>,
	now: number,
	staleAfter: number = STALE_AFTER_MS,
): GroupedDownloads {
	const forget: string[] = []
	const byKey = new Map<string, QueuedDownload[]>()

	for (const entry of entries) {
		const abandoned =
			!entry.done && !running.has(entry.trackId) && now - entry.queuedAt > staleAfter

		if (abandoned) {
			forget.push(entry.trackId)
			continue
		}

		const key = entry.albumId ?? `track:${entry.trackId}`
		byKey.set(key, [...(byKey.get(key) ?? []), entry])
	}

	const groups: DownloadGroup[] = []

	for (const [key, members] of byKey) {
		const done = members.filter((entry) => entry.done).length

		if (done === members.length) {
			forget.push(...members.map((entry) => entry.trackId))
			continue
		}

		const inFlight = members.reduce(
			(sum, entry) => (entry.done ? sum : sum + clamp(running.get(entry.trackId) ?? 0)),
			0,
		)

		const first = members[0]
		const isAlbum = Boolean(first.albumId)

		groups.push({
			key,
			albumId: first.albumId,
			title: (isAlbum ? first.album : first.title) ?? first.title ?? first.album ?? '',
			artist: first.artist,
			imageTag: first.imageTag,
			total: members.length,
			done,
			progress: (done + inFlight) / members.length,
			trackIds: members.map((entry) => entry.trackId),
			queuedAt: Math.min(...members.map((entry) => entry.queuedAt)),
		})
	}

	groups.sort((a, b) => a.queuedAt - b.queuedAt || a.title.localeCompare(b.title))

	return { groups, forget }
}
