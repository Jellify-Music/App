import { waitFor } from '@testing-library/react-native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	resetPlaylistIndexing,
	retryPlaylistIndexing,
	startPlaylistIndexing,
	usePlaylistIndexStatus,
} from '../../src/services/playlist-indexer'
import usePlaylistArtistsStore from '../../src/stores/playlist-artists'
import { memoryStorageValues } from '../helpers/memory-storage'
import { summaryVersion } from '../../src/utils/artist-playlists'

type Read = { playlist: BaseItemDto; signal?: AbortSignal; finish: () => void; fail: () => void }

let mockReads: Read[] = []
let mockAutoFinish = true

jest.mock('../../src/api/queries/playlist/utils', () => ({
	fetchPlaylistArtists: (playlist: BaseItemDto, signal?: AbortSignal) =>
		new Promise<{ artistIds: string[] }>((resolve, reject) => {
			const read = {
				playlist,
				signal,
				finish: () => resolve({ artistIds: [`artist-of-${playlist.Id}`] }),
				fail: () => reject(new Error('network')),
			}

			mockReads.push(read)

			if (mockAutoFinish) read.finish()
		}),
}))

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const playlists = (count: number, prefix = 'p'): BaseItemDto[] =>
	Array.from({ length: count }, (_, i) => ({
		Id: `${prefix}${i}`,
		Etag: `etag-${prefix}${i}`,
		ChildCount: 1,
	}))

const summaries = () => usePlaylistArtistsStore.getState().summaries

const settle = () => new Promise((resolve) => setTimeout(resolve, 10))

let stops: (() => void)[] = []
const start = (list: BaseItemDto[], listsComplete = true) => {
	const stop = startPlaylistIndexing(list, listsComplete)
	stops.push(stop)

	return stop
}

beforeEach(() => {
	mockReads = []
	mockAutoFinish = true
	memoryStorageValues.clear()
	usePlaylistArtistsStore.setState({ summaries: {} })
	usePlaylistIndexStatus.setState({ failed: 0 })
})

afterEach(async () => {
	stops.forEach((stop) => stop())
	stops = []

	// the indexer stops a moment after the last consumer lets go
	await settle()
})

describe('playlist indexer', () => {
	it('summarises every playlist it is given', async () => {
		const list = playlists(5)

		start(list)

		await waitFor(() => expect(Object.keys(summaries())).toHaveLength(5))

		expect(summaries().p3).toEqual({
			version: summaryVersion(list[3]),
			artistIds: ['artist-of-p3'],
		})
	})

	it('mockReads each playlist once, however many consumers ask for it', async () => {
		const list = playlists(8)

		start(list)
		start(list)
		start(list)

		await waitFor(() => expect(Object.keys(summaries())).toHaveLength(8))

		expect(mockReads).toHaveLength(8)
	})

	it('never mockReads more than a handful of playlists at once', async () => {
		mockAutoFinish = false

		start(playlists(30))

		await waitFor(() => expect(mockReads.length).toBeGreaterThan(0))
		expect(mockReads).toHaveLength(6)

		// finishing some lets others start, but the number in flight stays capped
		mockReads.slice(0, 3).forEach((read) => read.finish())

		await waitFor(() => expect(mockReads).toHaveLength(9))
	})

	it('leaves alone the playlists whose summary is up to date, and re-mockReads edited ones', async () => {
		const list = playlists(3)
		usePlaylistArtistsStore.setState({
			summaries: {
				p0: { version: summaryVersion(list[0]), artistIds: ['x'] },
				p1: { version: 'etag:out-of-date', artistIds: ['x'] },
			},
		})

		start(list)

		await waitFor(() => expect(Object.keys(mockReads)).toHaveLength(2))
		await waitFor(() => expect(summaries().p1.version).toBe(summaryVersion(list[1])))

		expect(mockReads.map((read) => read.playlist.Id).sort()).toEqual(['p1', 'p2'])
	})

	it('does not read a playlist again when it is asked for while still being read', async () => {
		mockAutoFinish = false
		const list = playlists(3)

		start(list)
		await waitFor(() => expect(mockReads).toHaveLength(3))

		// the lists were refreshed, with the same playlists
		start([...list])
		await settle()

		expect(mockReads).toHaveLength(3)
	})

	it('cancels what is in flight once the last consumer lets go', async () => {
		mockAutoFinish = false

		const stopFirst = start(playlists(3))
		const stopSecond = start(playlists(3))

		await waitFor(() => expect(mockReads).toHaveLength(3))

		stopFirst()
		await settle()

		expect(mockReads.every((read) => !read.signal?.aborted)).toBe(true)

		stopSecond()
		await settle()

		expect(mockReads.every((read) => read.signal?.aborted)).toBe(true)
	})

	it('carries on when a consumer is replaced by another straight away', async () => {
		mockAutoFinish = false
		const list = playlists(3)

		const stop = start(list)
		await waitFor(() => expect(mockReads).toHaveLength(3))

		// what happens when a page re-renders with refreshed lists
		stop()
		start([...list])
		await settle()

		expect(mockReads.every((read) => !read.signal?.aborted)).toBe(true)
	})

	it('keeps what it has finished when stopped part of the way', async () => {
		mockAutoFinish = false

		const stop = start(playlists(3))
		await waitFor(() => expect(mockReads).toHaveLength(3))

		mockReads[0].finish()
		await settle()

		stop()
		await settle()

		expect(Object.keys(summaries())).toEqual(['p0'])
		expect([...memoryStorageValues.keys()]).toEqual(['playlist-artists/v1/p0'])
	})

	it('counts playlists it could not read, and mockReads them again when asked to retry', async () => {
		mockAutoFinish = false

		start(playlists(2))
		await waitFor(() => expect(mockReads).toHaveLength(2))

		mockReads[0].fail()
		mockReads[1].finish()

		await waitFor(() => expect(usePlaylistIndexStatus.getState().failed).toBe(1))
		expect(Object.keys(summaries())).toEqual(['p1'])

		mockAutoFinish = true
		retryPlaylistIndexing()

		await waitFor(() => expect(Object.keys(summaries()).sort()).toEqual(['p0', 'p1']))
		expect(usePlaylistIndexStatus.getState().failed).toBe(0)
	})

	it('forgets playlists that no longer exist once everything has been read', async () => {
		usePlaylistArtistsStore.setState({
			summaries: { deleted: { version: 'etag:old', artistIds: ['x'] } },
		})

		start(playlists(2))

		await waitFor(() => expect(Object.keys(summaries()).sort()).toEqual(['p0', 'p1']))
	})

	it('keeps summaries of missing playlists when the lists were not all loaded', async () => {
		usePlaylistArtistsStore.setState({
			summaries: { elsewhere: { version: 'etag:old', artistIds: ['x'] } },
		})

		start(playlists(2), false)

		await waitFor(() => expect(Object.keys(summaries())).toHaveLength(3))
	})

	it('keeps summaries when some playlists could not be read', async () => {
		mockAutoFinish = false
		usePlaylistArtistsStore.setState({
			summaries: { other: { version: 'etag:old', artistIds: ['x'] } },
		})

		start(playlists(1))
		await waitFor(() => expect(mockReads).toHaveLength(1))

		mockReads[0].fail()
		await waitFor(() => expect(usePlaylistIndexStatus.getState().failed).toBe(1))

		expect(Object.keys(summaries())).toEqual(['other'])
	})

	describe('when the user signs out', () => {
		it('cancels what is in flight and forgets every summary', async () => {
			mockAutoFinish = false
			memoryStorageValues.set('playlist-artists/v1/old', 'etag:1\nx')
			memoryStorageValues.set('unrelated', 'kept')
			usePlaylistArtistsStore.setState({
				summaries: { old: { version: 'etag:1', artistIds: ['x'] } },
			})

			start(playlists(3))
			await waitFor(() => expect(mockReads).toHaveLength(3))

			resetPlaylistIndexing()

			expect(mockReads.every((read) => read.signal?.aborted)).toBe(true)
			expect(summaries()).toEqual({})
			expect([...memoryStorageValues.keys()]).toEqual(['unrelated'])
			expect(usePlaylistIndexStatus.getState().failed).toBe(0)

			// a read finishing after the reset must not bring anything back
			mockReads.forEach((read) => read.finish())
			await settle()

			expect(summaries()).toEqual({})
		})

		it('can start again for the next user', async () => {
			start(playlists(2))
			await waitFor(() => expect(Object.keys(summaries())).toHaveLength(2))

			resetPlaylistIndexing()

			start(playlists(3, 'next'))

			await waitFor(() =>
				expect(Object.keys(summaries()).sort()).toEqual(['next0', 'next1', 'next2']),
			)
		})
	})
})
