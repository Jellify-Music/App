import useDownloadQueueStore, {
	hydrateDownloadQueue,
	queuedDownloadFrom,
	resetDownloadQueueHydration,
} from '../../src/stores/download-queue'
import { memoryStorageValues } from '../helpers/memory-storage'

jest.mock('../../src/constants/storage', () => require('../helpers/memory-storage'))

const track = (Id: string, overrides = {}) => ({
	Id,
	Name: `Track ${Id}`,
	AlbumId: 'album-1',
	Album: 'Echo',
	AlbumArtist: 'Of Mice & Men',
	AlbumPrimaryImageTag: 'tag-1',
	...overrides,
})

const reset = () => {
	memoryStorageValues.clear()
	useDownloadQueueStore.setState({ entries: {} })
	resetDownloadQueueHydration()
}

describe('the download queue store', () => {
	beforeEach(reset)

	it('remembers what a track is part of, as not done', () => {
		useDownloadQueueStore.getState().record([track('1')], 123)

		expect(useDownloadQueueStore.getState().entries['1']).toEqual({
			trackId: '1',
			title: 'Track 1',
			albumId: 'album-1',
			album: 'Echo',
			artist: 'Of Mice & Men',
			imageTag: 'tag-1',
			queuedAt: 123,
			done: false,
		})
	})

	it('has the artist from the track when there is no album artist, and skips items with no id', () => {
		expect(queuedDownloadFrom({ Id: '1', Artists: ['Solo'] }, 0)?.artist).toBe('Solo')
		expect(queuedDownloadFrom({ Name: 'No id' }, 0)).toBeUndefined()

		useDownloadQueueStore.getState().record([{ Name: 'No id' }, track('2')])

		expect(Object.keys(useDownloadQueueStore.getState().entries)).toEqual(['2'])
	})

	it('marks a track done, once', () => {
		const { record, markDone } = useDownloadQueueStore.getState()
		record([track('1')])

		markDone('1')
		const after = useDownloadQueueStore.getState().entries
		markDone('1')
		markDone('unknown')

		expect(after['1'].done).toBe(true)
		// nothing was replaced by the repeats
		expect(useDownloadQueueStore.getState().entries).toBe(after)
	})

	it('removes tracks, from memory and from storage', () => {
		const { record, remove } = useDownloadQueueStore.getState()
		record([track('1'), track('2')])

		remove(['1'])

		expect(Object.keys(useDownloadQueueStore.getState().entries)).toEqual(['2'])
		expect([...memoryStorageValues.keys()]).toEqual(['download-queue/v1/2'])
	})

	it('saves each track on its own, so one finishing writes one', () => {
		const { record, markDone } = useDownloadQueueStore.getState()
		record([track('1'), track('2')])
		memoryStorageValues.clear()

		markDone('1')

		expect([...memoryStorageValues.keys()]).toEqual(['download-queue/v1/1'])
	})

	it('reads back what was saved when the app was last closed, keeping anything queued since', () => {
		useDownloadQueueStore.getState().record([track('1'), track('2')])
		useDownloadQueueStore.getState().markDone('1')

		// a new session: nothing in memory but what is in storage
		useDownloadQueueStore.setState({ entries: {} })
		resetDownloadQueueHydration()
		useDownloadQueueStore.getState().record([track('3')])

		hydrateDownloadQueue()

		const entries = useDownloadQueueStore.getState().entries
		expect(Object.keys(entries).sort()).toEqual(['1', '2', '3'])
		expect(entries['1'].done).toBe(true)
		expect(entries['2'].done).toBe(false)
	})

	it('drops saved entries it cannot read', () => {
		memoryStorageValues.set('download-queue/v1/bad', '{not json')
		memoryStorageValues.set('other/key', 'x')

		hydrateDownloadQueue()

		expect(useDownloadQueueStore.getState().entries).toEqual({})
		expect(memoryStorageValues.has('download-queue/v1/bad')).toBe(false)
		expect(memoryStorageValues.has('other/key')).toBe(true)
	})
})
