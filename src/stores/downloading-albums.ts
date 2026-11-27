import { create } from 'zustand'

type NumbersByAlbum = Record<string, number>

type DownloadingAlbumsStore = {
	/** How far along each album that is downloading is, 0 to 1, by album ID */
	progress: NumbersByAlbum
	/** How many tracks of each album are downloaded, by album ID */
	downloaded: NumbersByAlbum
	set: (progress: NumbersByAlbum) => void
	setDownloaded: (downloaded: NumbersByAlbum) => void
}

const same = (a: NumbersByAlbum, b: NumbersByAlbum) => {
	const keys = Object.keys(b)

	return keys.length === Object.keys(a).length && keys.every((key) => a[key] === b[key])
}

/**
 * Which albums are downloading and how far along, and how much of each is downloaded. A list of albums can be long, so it is worked
 * out once, by one watcher, and each row reads its own album's number: a row only renders again
 * when its own album's progress changes.
 */
const useDownloadingAlbumsStore = create<DownloadingAlbumsStore>()((set) => ({
	progress: {},
	downloaded: {},
	set: (next) => set((state) => (same(state.progress, next) ? state : { progress: next })),
	setDownloaded: (next) =>
		set((state) => (same(state.downloaded, next) ? state : { downloaded: next })),
}))

export default useDownloadingAlbumsStore
