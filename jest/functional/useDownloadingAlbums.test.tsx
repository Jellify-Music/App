import { act, renderHook } from '@testing-library/react-native'
import { useDownloadingAlbums } from '../../src/hooks/downloads/queue'
import useDownloadQueueStore from '../../src/stores/download-queue'

let mockActive: { trackId: string; state: string; progress: { progress: number } }[] = []
let mockProgressMap = new Map<string, unknown>()

jest.mock('react-native-nitro-player', () => ({
	useDownloadProgress: () => ({ progressMap: mockProgressMap }),
	DownloadManager: { getActiveDownloads: () => mockActive },
}))
jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const task = (trackId: string, progress: number, state = 'downloading') => ({
	trackId,
	state,
	progress: { progress },
})

const queue = (albumId: string, ...ids: string[]) =>
	useDownloadQueueStore
		.getState()
		.record(
			ids.map((id) => ({ Id: id, Name: id, AlbumId: albumId, Album: `Album ${albumId}` })),
		)

describe('useDownloadingAlbums', () => {
	beforeEach(() => {
		mockActive = []
		mockProgressMap = new Map()
		useDownloadQueueStore.setState({ entries: {} })
	})

	it('has each album that is downloading, with its own progress', async () => {
		queue('a', '1', '2')
		queue('b', '3')
		mockActive = [task('1', 0.5), task('3', 0.2)]

		const { result } = await renderHook(() => useDownloadingAlbums())

		const byAlbum = Object.fromEntries(result.current.map((g) => [g.albumId, g]))
		expect(byAlbum.a.progress).toBeCloseTo(0.25)
		expect(byAlbum.b.progress).toBeCloseTo(0.2)
	})

	it('counts a track as done once the downloader says so', async () => {
		queue('a', '1', '2')
		mockActive = [task('2', 0)]

		const { result } = await renderHook(() => useDownloadingAlbums())

		await act(async () => useDownloadQueueStore.getState().markDone('1'))

		expect(result.current[0]).toMatchObject({ done: 1, total: 2 })
		expect(result.current[0].progress).toBeCloseTo(0.5)
	})

	it('limits it to albums with a track among those asked for', async () => {
		queue('a', '1')
		queue('b', '2')
		mockActive = [task('1', 0.1), task('2', 0.1)]

		const { result } = await renderHook(() => useDownloadingAlbums(new Set(['2'])))

		expect(result.current.map((g) => g.albumId)).toEqual(['b'])
	})

	it('forgets an album once all of it is done', async () => {
		queue('a', '1')

		const { result } = await renderHook(() => useDownloadingAlbums())

		await act(async () => useDownloadQueueStore.getState().markDone('1'))

		expect(result.current).toEqual([])
		expect(useDownloadQueueStore.getState().entries).toEqual({})
	})

	it('does not take a task that is not running for one that is', async () => {
		queue('a', '1')
		mockActive = [task('1', 1, 'completed')]

		const { result } = await renderHook(() => useDownloadingAlbums())

		// queued just now, so it is kept, but nothing counts as in flight
		expect(result.current[0].progress).toBe(0)
	})
})
