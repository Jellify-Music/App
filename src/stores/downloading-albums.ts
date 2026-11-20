import { create } from 'zustand'

type DownloadingAlbumsStore = {
	/** How far along each album that is downloading is, 0 to 1, by album ID */
	progress: Record<string, number>
	set: (progress: Record<string, number>) => void
}

/**
 * Which albums are downloading and how far along. A list of albums can be long, so it is worked
 * out once, by one watcher, and each row reads its own album's number: a row only renders again
 * when its own album's progress changes.
 */
const useDownloadingAlbumsStore = create<DownloadingAlbumsStore>()((set) => ({
	progress: {},
	set: (next) =>
		set((state) => {
			const keys = Object.keys(next)

			const unchanged =
				keys.length === Object.keys(state.progress).length &&
				keys.every((key) => state.progress[key] === next[key])

			return unchanged ? state : { progress: next }
		}),
}))

export default useDownloadingAlbumsStore
