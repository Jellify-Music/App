import { PlayerQueue, TrackItem } from 'react-native-nitro-player'
import { replaceQueue, updateQueueStore } from '../../../src/stores/player/utils/replace'
import { setQueue } from '../../../src/stores/player/utils/set'
import { PlayerQueueStore, PlayerQueueStoreSet } from '../../../src/stores/player/types'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../src/constants/android-auto'

jest.mock('react-native-uuid', () => ({
	__esModule: true,
	default: { v4: jest.fn().mockReturnValue('test-uuid') },
}))

const createTrack = (id: string, url = `https://example.com/${id}.mp3`): TrackItem =>
	({ id, title: id, artist: 'Artist', album: 'Album', duration: 180, url }) as TrackItem

const createState = (overrides: Partial<PlayerQueueStore>): PlayerQueueStore =>
	({
		queue: [],
		unShuffledQueue: [],
		currentIndex: undefined,
		setQueue: jest.fn(),
		...overrides,
	}) as unknown as PlayerQueueStore

// ─── setQueue ────────────────────────────────────────────────────────────────

describe('setQueue', () => {
	it('only sets the queue when no unshuffled queue is given', () => {
		const set = jest.fn()
		const queue = [createTrack('a')]

		setQueue(set as unknown as PlayerQueueStoreSet)(queue)

		expect(set).toHaveBeenCalledWith({ queue })
	})

	it('sets both queues when an unshuffled queue is given', () => {
		const set = jest.fn()
		const queue = [createTrack('b'), createTrack('a')]
		const unShuffledQueue = [createTrack('a'), createTrack('b')]

		setQueue(set as unknown as PlayerQueueStoreSet)(queue, unShuffledQueue)

		expect(set).toHaveBeenCalledWith({ queue, unShuffledQueue })
	})
})

// ─── replaceQueue ────────────────────────────────────────────────────────────

describe('replaceQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([])
		;(PlayerQueue.createPlaylist as jest.Mock).mockResolvedValue('new-playlist')
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
	})

	it("clears the app's playlists but keeps Android Auto's", async () => {
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValue([
			{ id: 'old', name: 'old-queue' },
			{ id: 'car', name: `${AA_PLAYLIST_NAME_PREFIX}albums` },
		])

		await replaceQueue(jest.fn() as unknown as PlayerQueueStoreSet)({
			queue: [createTrack('a')],
			unShuffledQueue: [createTrack('a')],
			queueRef: 'Library',
			index: 0,
			shuffled: false,
		})

		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('old')
		expect(PlayerQueue.deletePlaylist).not.toHaveBeenCalledWith('car')
	})

	it('sets the store before loading the playlist at the given index', async () => {
		const callOrder: string[] = []
		const set = jest.fn(() => {
			callOrder.push('set')
		})
		;(PlayerQueue.loadPlaylist as jest.Mock).mockImplementation(async () => {
			callOrder.push('loadPlaylist')
		})

		const queue = [createTrack('b'), createTrack('a')]
		const unShuffledQueue = [createTrack('a'), createTrack('b')]

		await replaceQueue(set as unknown as PlayerQueueStoreSet)({
			queue,
			unShuffledQueue,
			queueRef: 'Library Shuffle',
			index: 1,
			shuffled: true,
		})

		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith('new-playlist', queue)
		expect(set).toHaveBeenCalledWith({
			queue,
			unShuffledQueue,
			queueRef: 'Library Shuffle',
			currentIndex: 1,
			shuffled: true,
		})
		expect(PlayerQueue.loadPlaylist).toHaveBeenCalledWith('new-playlist', 1)
		expect(callOrder).toEqual(['set', 'loadPlaylist'])
	})
})

// ─── updateQueueStore ────────────────────────────────────────────────────────

describe('updateQueueStore', () => {
	it('fills in the URL of a current track that is still waiting on one', () => {
		const current = createTrack('a', '')
		const updated = createTrack('a')
		const state = createState({ queue: [current], unShuffledQueue: [current], currentIndex: 0 })

		updateQueueStore(state, [updated])

		expect(state.setQueue).toHaveBeenCalledWith([updated], [updated])
	})

	it('applies metadata updates to the current track when the URL is unchanged', () => {
		const current = createTrack('a')
		const updated = { ...createTrack('a'), title: 'Renamed' }
		const state = createState({ queue: [current], unShuffledQueue: [current], currentIndex: 0 })

		updateQueueStore(state, [updated])

		expect(state.setQueue).toHaveBeenCalledWith([updated], [updated])
	})

	it('updates every copy of a queued track', () => {
		const track = createTrack('a', '')
		const other = createTrack('b')
		const updated = createTrack('a')
		const state = createState({
			queue: [other, track, track],
			unShuffledQueue: [track, other],
			currentIndex: 0,
		})

		updateQueueStore(state, [updated])

		expect(state.setQueue).toHaveBeenCalledWith([other, updated, updated], [updated, other])
	})

	it('uses the last update with a URL when an id appears more than once', () => {
		const track = createTrack('a', '')
		const first = createTrack('a', 'https://example.com/first.mp3')
		const last = createTrack('a', 'https://example.com/last.mp3')
		const state = createState({ queue: [track], unShuffledQueue: [track] })

		updateQueueStore(state, [first, last, createTrack('a', '')])

		expect(state.setQueue).toHaveBeenCalledWith([last], [last])
	})
})
