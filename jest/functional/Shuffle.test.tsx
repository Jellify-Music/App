import 'react-native'
import { shuffleJellifyTracks } from '../../src/hooks/player/functions/utils/shuffle'
import { handleDeshuffle, handleShuffle } from '../../src/hooks/player/functions/shuffle'
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
		;(PlayerQueue.removeTrackFromPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(usePlayerQueueStore.setState as jest.Mock).mockImplementation(() => undefined)
	})

	it('moves current track to the front when shuffling', async () => {
		const [track1, track2, track3, track4] = createMockTracks(4)
		const setIsQueuing = jest.fn()
		const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9)
		const expectedQueue = [track3, track1, track2, track4]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 2,
			queue: [track1, track2, track3, track4],
			setIsQueuing,
		})
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(expectedQueue)

		const result = await handleShuffle()
		randomSpy.mockRestore()

		expect(setIsQueuing).toHaveBeenNthCalledWith(1, true)
		expect(setIsQueuing).toHaveBeenNthCalledWith(2, false)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenCalledTimes(3)
		expect(result.currentIndex).toBe(0)
		expect(result.queue).toHaveLength(4)
		expect(result.queue[0]).toEqual(track3)
		expect(result.queue.map((track) => track.id).sort()).toEqual(
			[track1.id, track2.id, track3.id, track4.id].sort(),
		)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledTimes(1)
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenNthCalledWith(
			1,
			'playlist-1',
			expectedQueue.slice(1),
		)
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))
	})

	it('restores original order around current track and returns original index', async () => {
		const [track1, track2, track3, track4] = createMockTracks(4)
		const setIsQueuing = jest.fn()

		const shuffledQueue = [track3, track1, track4, track2]
		const originalQueue = [track1, track2, track3, track4]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			currentIndex: 0,
			shuffled: true,
			unShuffledQueue: originalQueue,
			queue: shuffledQueue,
			setIsQueuing,
		})
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(originalQueue)

		const result = await handleDeshuffle()

		expect(setIsQueuing).toHaveBeenNthCalledWith(1, true)
		expect(setIsQueuing).toHaveBeenNthCalledWith(2, false)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenCalledTimes(3)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenNthCalledWith(
			1,
			'playlist-1',
			track1.id,
		)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenNthCalledWith(
			2,
			'playlist-1',
			track4.id,
		)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenNthCalledWith(
			3,
			'playlist-1',
			track2.id,
		)

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

		expect(PlayerQueue.removeTrackFromPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).not.toHaveBeenCalled()
		expect(setIsQueuing).not.toHaveBeenCalled()
		expect(result).toEqual({
			currentIndex: 0,
			queue: [unknownCurrentTrack, track2, track3, track4],
		})
	})
})
