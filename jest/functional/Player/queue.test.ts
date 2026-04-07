import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { reorderQueue } from '../../../src/hooks/player/functions/queue'
import { usePlayerQueueStore } from '../../../src/stores/player/queue'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
}))

const createTrack = (id: string): TrackItem =>
	({
		id,
		title: id,
		artist: 'Artist',
		album: 'Album',
		duration: 180,
		url: `https://example.com/${id}.mp3`,
		sessionId: 'TEST_SESSION_ID',
		extraPayload: {
			sourceType: 'stream',
			sessionId: 'TEST_SESSION_ID',
		},
	}) as TrackItem

describe('Queue - reorderQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('updates currentIndex by current track id after reorder', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')
		const trackD = createTrack('d')

		const prevQueue = [trackA, trackB, trackC, trackD]
		const reorderedQueue = [trackB, trackC, trackD, trackA]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			queue: prevQueue,
			currentIndex: 2,
		})
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks: prevQueue })
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(reorderedQueue)

		await reorderQueue({ fromIndex: 0, toIndex: 3 })

		expect(PlayerQueue.reorderTrackInPlaylist).toHaveBeenCalledWith('playlist-1', 'a', 3)
		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls[0][0]
		const nextState = stateUpdater({ queue: prevQueue, currentIndex: 2 })

		expect(nextState.queue).toEqual(reorderedQueue)
		expect(nextState.currentIndex).toBe(1)
	})

	it('falls back to previous index if current track is missing in updated queue', async () => {
		const trackA = createTrack('a')
		const trackB = createTrack('b')
		const trackC = createTrack('c')

		const prevQueue = [trackA, trackB, trackC]
		const updatedQueueWithoutCurrent = [trackA, trackB]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			queue: prevQueue,
			currentIndex: 2,
		})
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.getPlaylist as jest.Mock).mockReturnValue({ tracks: prevQueue })
		;(PlayerQueue.reorderTrackInPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(updatedQueueWithoutCurrent)

		await reorderQueue({ fromIndex: 0, toIndex: 1 })

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls[0][0]
		const nextState = stateUpdater({ queue: prevQueue, currentIndex: 2 })

		expect(nextState.queue).toEqual(updatedQueueWithoutCurrent)
		expect(nextState.currentIndex).toBe(2)
		expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
	})

	it('returns early when there is no active playlist', async () => {
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue(undefined)

		await reorderQueue({ fromIndex: 0, toIndex: 1 })

		expect(PlayerQueue.getPlaylist).not.toHaveBeenCalled()
		expect(PlayerQueue.reorderTrackInPlaylist).not.toHaveBeenCalled()
		expect(TrackPlayer.getActualQueue).not.toHaveBeenCalled()
		expect(usePlayerQueueStore.setState).not.toHaveBeenCalled()
	})
})
