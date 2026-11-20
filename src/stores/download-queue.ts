import { create } from 'zustand'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { storage } from '../constants/storage'

/**
 * A track that was handed to the downloader, and what it belongs to. The downloader reports a
 * running download only by its track ID, so this is how an album's progress can be shown.
 */
export interface QueuedDownload {
	trackId: string
	title?: string
	albumId?: string
	album?: string
	artist?: string
	/** Tag of the album's cover, to show it */
	imageTag?: string
	queuedAt: number
	/** Whether the track has finished downloading */
	done: boolean
}

type DownloadQueueStore = {
	entries: Record<string, QueuedDownload>
	/** Adds tracks as queued, starting them off as not done */
	record: (items: BaseItemDto[], now?: number) => void
	markDone: (trackId: string) => void
	remove: (trackIds: string[]) => void
}

/**
 * Each entry is saved on its own, as a downloading library can be thousands of tracks and one
 * finishing should not write all the rest again. Bump the number when the format changes.
 */
const KEY_PREFIX = 'download-queue/v1/'

export const queuedDownloadFrom = (item: BaseItemDto, now: number): QueuedDownload | undefined =>
	item.Id
		? {
				trackId: item.Id,
				title: item.Name ?? undefined,
				albumId: item.AlbumId ?? undefined,
				album: item.Album ?? undefined,
				artist: item.AlbumArtist ?? item.Artists?.[0] ?? undefined,
				imageTag: item.AlbumPrimaryImageTag ?? undefined,
				queuedAt: now,
				done: false,
			}
		: undefined

const save = (entry: QueuedDownload) =>
	storage.set(KEY_PREFIX + entry.trackId, JSON.stringify(entry))

const useDownloadQueueStore = create<DownloadQueueStore>()((set) => ({
	entries: {},

	record: (items, now = Date.now()) => {
		const added = items.flatMap((item) => {
			const entry = queuedDownloadFrom(item, now)
			return entry ? [entry] : []
		})

		added.forEach(save)

		set((state) => ({
			entries: { ...state.entries, ...Object.fromEntries(added.map((e) => [e.trackId, e])) },
		}))
	},

	markDone: (trackId) =>
		set((state) => {
			const entry = state.entries[trackId]

			if (!entry || entry.done) return state

			const done = { ...entry, done: true }
			save(done)

			return { entries: { ...state.entries, [trackId]: done } }
		}),

	remove: (trackIds) => {
		if (trackIds.length === 0) return

		trackIds.forEach((id) => storage.remove(KEY_PREFIX + id))

		set((state) => {
			const entries = { ...state.entries }
			trackIds.forEach((id) => delete entries[id])
			return { entries }
		})
	},
}))

let hydrated = false

/** Reads what was queued before the app was last closed, once: downloads carry on without it */
export function hydrateDownloadQueue() {
	if (hydrated) return

	hydrated = true

	const saved: Record<string, QueuedDownload> = {}

	for (const key of storage.getAllKeys()) {
		if (!key.startsWith(KEY_PREFIX)) continue

		try {
			const entry: QueuedDownload = JSON.parse(storage.getString(key) ?? '')

			if (entry.trackId) saved[entry.trackId] = entry
		} catch {
			storage.remove(key)
		}
	}

	useDownloadQueueStore.setState((state) => ({ entries: { ...saved, ...state.entries } }))
}

/** For tests: forgets that the saved entries have been read */
export const resetDownloadQueueHydration = () => {
	hydrated = false
}

export default useDownloadQueueStore
