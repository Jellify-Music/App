import 'react-native'
import { shuffleJellifyTracks } from '../../src/player/utils/shuffle'
import { handleDeshuffle, handleShuffle, toggleShuffle } from '../../src/player/controls/shuffle'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { usePlayerQueueStore } from '../../src/stores/player/queue'

jest.mock('../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
}))

// Test the shuffle utility function directly
describe('Shuffle Utility Function', () => {
	const createMockTracks = (count: number): TrackItem[] =>
		Array.from({ length: count }, (_, i) => ({
			url: `https://example.com/${i + 1}`,
			id: `track-${i + 1}`,
			title: `Track ${i + 1}`,
			artist: `Artist ${i + 1}`,
			album: `Album ${i + 1}`,
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
			extraPayload: {
				item: JSON.stringify({
					Id: `${i + 1}`,
					Name: `Track ${i + 1}`,
					Artists: [`Artist ${i + 1}`],
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
		}))

	test('should shuffle tracks correctly', () => {
		const tracks = createMockTracks(5)
		const result = shuffleJellifyTracks(tracks)

		expect(result.shuffled).toHaveLength(5)
		expect(result.original).toEqual(tracks)

		// Verify all tracks are still present (just reordered)
		const originalIds = tracks.map((t) => t.id).sort()
		const shuffledIds = result.shuffled.map((t) => t.id).sort()
		expect(shuffledIds).toEqual(originalIds)
	})

	test('should handle empty array', () => {
		const result = shuffleJellifyTracks([])

		expect(result.shuffled).toHaveLength(0)
		expect(result.original).toHaveLength(0)
	})
})

describe('Deshuffle Function', () => {
	const createMockTracks = (count: number): TrackItem[] =>
		Array.from({ length: count }, (_, i) => ({
			url: `https://example.com/${i + 1}`,
			id: `track-${i + 1}`,
			title: `Track ${i + 1}`,
			artist: `Artist ${i + 1}`,
			album: `Album ${i + 1}`,
			duration: 420,
			sessionId: 'TEST_SESSION_ID',
			sourceType: 'stream',
			extraPayload: {
				item: JSON.stringify({
					Id: `${i + 1}`,
					Name: `Track ${i + 1}`,
					Artists: [`Artist ${i + 1}`],
				}),
				sourceType: 'stream',
				sessionId: 'TEST_SESSION_ID',
			},
		}))

	beforeEach(() => {
		jest.clearAllMocks()
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.removeTracksFromPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.shufflePlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(() => undefined)
	})

	it('shuffles natively and reads the new order back from the playlist', async () => {
		const [track1, track2, track3, track4] = createMockTracks(4)
		const nativeShuffledQueue = [track3, track4, track1, track2]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 2,
			queue: [track1, track2, track3, track4],
		})
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({
			id: 'playlist-1',
			name: 'Queue',
			tracks: nativeShuffledQueue,
		})

		const result = await handleShuffle()

		expect(PlayerQueue.shufflePlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.shufflePlaylist).toHaveBeenCalledWith('playlist-1', {
			keepCurrentTrackFirst: true,
		})
		expect(PlayerQueue.removeTrackFromPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()
		expect(result).toEqual({ currentIndex: 0, queue: nativeShuffledQueue })
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))
	})

	it('returns undefined and leaves the store alone when the native shuffle fails', async () => {
		const tracks = createMockTracks(3)

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 0,
			queue: tracks,
		})
		;(PlayerQueue.shufflePlaylist as jest.Mock).mockRejectedValue(new Error('boom'))

		const result = await handleShuffle()

		expect(result).toBeUndefined()
		expect(usePlayerQueueStore.setState).not.toHaveBeenCalled()
	})

	it('restores original order around current track and returns original index', async () => {
		const [track1, track2, track3, track4] = createMockTracks(4)

		const shuffledQueue = [track3, track1, track4, track2]
		const originalQueue = [track1, track2, track3, track4]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 0,
			shuffled: true,
			unShuffledQueue: originalQueue,
			queue: shuffledQueue,
		})
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(originalQueue)

		const result = await handleDeshuffle()

		expect(PlayerQueue.removeTracksFromPlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.removeTracksFromPlaylist).toHaveBeenCalledWith('playlist-1', [
			track1.id,
			track4.id,
			track2.id,
		])

		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenNthCalledWith(
			1,
			'playlist-1',
			[track1, track2],
			0,
		)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenNthCalledWith(2, 'playlist-1', [track4])

		expect(usePlayerQueueStore.setState).toHaveBeenCalledTimes(1)
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))
		expect(result).toEqual({
			currentIndex: 2,
			queue: originalQueue,
		})
	})

	it('returns existing queue when current track is not in original queue', async () => {
		const [track1, track2, track3, track4] = createMockTracks(4)
		const unknownCurrentTrack = {
			...track1,
			id: 'track-999',
		}
		const setIsQueuing = jest.fn()

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 0,
			shuffled: true,
			unShuffledQueue: [track1, track2, track3, track4],
			queue: [unknownCurrentTrack, track2, track3, track4],
			setIsQueuing,
		})

		const result = await handleDeshuffle()

		expect(PlayerQueue.removeTracksFromPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).not.toHaveBeenCalled()
		expect(setIsQueuing).not.toHaveBeenCalled()
		expect(result).toEqual({
			currentIndex: 0,
			queue: [unknownCurrentTrack, track2, track3, track4],
		})
	})
	it('does not remove the playing track when it is queued more than once', async () => {
		const [track1, track2, track3] = createMockTracks(3)

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 0,
			shuffled: true,
			unShuffledQueue: [track1, track2, track3, track1],
			queue: [track1, track3, track1, track2],
		})

		await handleDeshuffle()

		expect(PlayerQueue.removeTracksFromPlaylist).toHaveBeenCalledWith('playlist-1', [
			track3.id,
			track2.id,
		])
	})
})

describe('toggleShuffle', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(() => undefined)
	})

	const tracks = [
		{ id: 'a', url: 'a' },
		{ id: 'b', url: 'b' },
	] as TrackItem[]

	it('flips shuffled before the native work resolves', async () => {
		let resolveShuffle: () => void = () => {}
		;(PlayerQueue.shufflePlaylist as jest.Mock).mockReturnValue(
			new Promise<void>((resolve) => (resolveShuffle = resolve)),
		)
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks })
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: false,
			currentIndex: 0,
			queue: tracks,
		})

		const pending = toggleShuffle()

		expect(usePlayerQueueStore.setState).toHaveBeenNthCalledWith(1, { shuffled: true })

		resolveShuffle()
		await pending
	})

	it('rolls shuffled back when the native work fails', async () => {
		;(PlayerQueue.shufflePlaylist as jest.Mock).mockRejectedValue(new Error('boom'))
		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: false,
			currentIndex: 0,
			queue: tracks,
		})

		await toggleShuffle()

		expect(usePlayerQueueStore.setState).toHaveBeenNthCalledWith(1, { shuffled: true })
		expect(usePlayerQueueStore.setState).toHaveBeenLastCalledWith({ shuffled: false })
	})
})
