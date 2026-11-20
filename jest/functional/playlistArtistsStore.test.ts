import usePlaylistArtistsStore, { clearPlaylistArtists } from '../../src/stores/playlist-artists'
import { memoryStorageValues } from '../helpers/memory-storage'

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const KEY = (id: string) => `playlist-artists/v1/${id}`

beforeEach(() => {
	memoryStorageValues.clear()
	usePlaylistArtistsStore.setState({ summaries: {} })
})

describe('playlist artists store', () => {
	it('saves each summary under a key of its own', () => {
		usePlaylistArtistsStore.getState().updateSummaries({
			a: { version: 'etag:1', artistIds: ['x', 'y'] },
			b: { version: 'count:3', artistIds: [] },
		})

		expect([...memoryStorageValues.keys()].sort()).toEqual([KEY('a'), KEY('b')])
		expect(usePlaylistArtistsStore.getState().summaries.a.artistIds).toEqual(['x', 'y'])
	})

	it('only writes the summaries that changed', () => {
		const { updateSummaries } = usePlaylistArtistsStore.getState()

		updateSummaries({ a: { version: 'v1', artistIds: ['x'] } })
		const before = memoryStorageValues.get(KEY('a'))
		memoryStorageValues.set(KEY('a'), 'marker')

		updateSummaries({ b: { version: 'v1', artistIds: ['y'] } })

		// a was left alone, rather than written out again alongside b
		expect(before).toBeDefined()
		expect(memoryStorageValues.get(KEY('a'))).toBe('marker')
		expect(memoryStorageValues.has(KEY('b'))).toBe(true)
	})

	it('deletes the summaries it is told to drop', () => {
		const { updateSummaries } = usePlaylistArtistsStore.getState()

		updateSummaries({
			a: { version: 'v1', artistIds: ['x'] },
			b: { version: 'v1', artistIds: ['y'] },
		})
		updateSummaries({}, ['a'])

		expect(Object.keys(usePlaylistArtistsStore.getState().summaries)).toEqual(['b'])
		expect([...memoryStorageValues.keys()]).toEqual([KEY('b')])
	})

	it('reads back what was saved, once', () => {
		jest.isolateModules(() => {
			memoryStorageValues.set(KEY('a'), 'etag:1\nx,y')
			memoryStorageValues.set(KEY('empty'), 'count:0\n')

			const fresh = require('../../src/stores/playlist-artists')

			fresh.hydratePlaylistArtists()

			expect(fresh.default.getState().summaries).toEqual({
				a: { version: 'etag:1', artistIds: ['x', 'y'] },
				empty: { version: 'count:0', artistIds: [] },
			})

			// a second call must not bring back what has since been dropped
			fresh.default.getState().updateSummaries({}, ['a'])
			fresh.hydratePlaylistArtists()

			expect(Object.keys(fresh.default.getState().summaries)).toEqual(['empty'])
		})
	})

	it('ignores values it cannot read, and summaries saved in another format', () => {
		jest.isolateModules(() => {
			memoryStorageValues.set(KEY('garbled'), 'no separator here')
			memoryStorageValues.set('playlist-artists/v0/old', 'etag:1\nx')
			memoryStorageValues.set('something-else', 'etag:1\nx')

			const fresh = require('../../src/stores/playlist-artists')

			fresh.hydratePlaylistArtists()

			expect(fresh.default.getState().summaries).toEqual({})
		})
	})

	it('keeps summaries added before the saved ones were read', () => {
		jest.isolateModules(() => {
			memoryStorageValues.set(KEY('p'), 'etag:old\nx')

			const fresh = require('../../src/stores/playlist-artists')

			fresh.default
				.getState()
				.updateSummaries({ p: { version: 'etag:new', artistIds: ['y'] } })
			fresh.hydratePlaylistArtists()

			expect(fresh.default.getState().summaries.p).toEqual({
				version: 'etag:new',
				artistIds: ['y'],
			})
		})
	})

	it('forgets every summary when cleared, leaving other storage alone', () => {
		memoryStorageValues.set('something-else', 'kept')
		usePlaylistArtistsStore.getState().updateSummaries({
			a: { version: 'v1', artistIds: ['x'] },
			b: { version: 'v1', artistIds: ['y'] },
		})

		clearPlaylistArtists()

		expect(usePlaylistArtistsStore.getState().summaries).toEqual({})
		expect([...memoryStorageValues.keys()]).toEqual(['something-else'])
	})

	it('reads what is saved afterwards, even though it has read before', () => {
		jest.isolateModules(() => {
			const fresh = require('../../src/stores/playlist-artists')

			fresh.hydratePlaylistArtists()
			fresh.clearPlaylistArtists()

			// saved by the next user's session
			memoryStorageValues.set(KEY('next'), 'etag:1\nx')
			fresh.hydratePlaylistArtists()

			expect(Object.keys(fresh.default.getState().summaries)).toEqual(['next'])
		})
	})
})
