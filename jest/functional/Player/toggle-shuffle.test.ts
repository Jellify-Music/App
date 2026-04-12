import 'react-native'
import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import {
	toggleShuffle,
	handleShuffle,
	handleDeshuffle,
} from '../../../src/hooks/player/functions/shuffle'
import { usePlayerQueueStore } from '../../../src/stores/player/queue'
import { triggerHaptic } from '../../../src/hooks/use-haptic-feedback'

jest.mock('../../../src/stores/player/queue', () => ({
	usePlayerQueueStore: {
		getState: jest.fn(),
		setState: jest.fn(),
	},
}))

jest.mock('../../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

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

describe('toggleShuffle', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(PlayerQueue.getCurrentPlaylistId as jest.Mock).mockReturnValue('playlist-1')
		;(PlayerQueue.removeTrackFromPlaylist as jest.Mock).mockResolvedValue(undefined)
		;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockResolvedValue(undefined)
	})

	it('calls handleShuffle and sets shuffled=true when currently unshuffled', async () => {
		const [track1, track2, track3] = createMockTracks(3)
		const setIsQueuing = jest.fn()
		const shuffledQueue = [track2, track1, track3]

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: false,
			currentIndex: 0,
			queue: [track1, track2, track3],
			setIsQueuing,
		})
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(shuffledQueue)

		await toggleShuffle()

		expect(triggerHaptic).toHaveBeenCalledWith('impactMedium')

		// handleShuffle should have been invoked (it uses PlayerQueue internally)
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalled()

		// toggleShuffle sets state with shuffled flipped to true
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls.at(-1)[0]
		const newState = stateUpdater({ shuffled: false, queue: [], currentIndex: 0 })
		expect(newState.shuffled).toBe(true)
	})

	it('calls handleDeshuffle and sets shuffled=false when currently shuffled', async () => {
		const [track1, track2, track3] = createMockTracks(3)
		const originalQueue = [track1, track2, track3]
		const shuffledQueue = [track2, track1, track3]
		const setIsQueuing = jest.fn()

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: true,
			currentIndex: 1,
			queue: shuffledQueue,
			unShuffledQueue: originalQueue,
			setIsQueuing,
		})
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue(originalQueue)

		await toggleShuffle()

		expect(triggerHaptic).toHaveBeenCalledWith('impactMedium')

		// handleDeshuffle removes tracks and re-adds in original order
		expect(PlayerQueue.removeTrackFromPlaylist).toHaveBeenCalled()
		expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalled()

		// toggleShuffle sets state with shuffled flipped to false
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))

		const stateUpdater = (usePlayerQueueStore.setState as jest.Mock).mock.calls.at(-1)[0]
		const newState = stateUpdater({ shuffled: true, queue: [], currentIndex: 0 })
		expect(newState.shuffled).toBe(false)
	})

	it('handles empty queue gracefully when unshuffled', async () => {
		const setIsQueuing = jest.fn()

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: false,
			currentIndex: 0,
			queue: [],
			setIsQueuing,
		})

		// handleShuffle returns early with a toast for empty/single-item queue
		await toggleShuffle()

		expect(triggerHaptic).toHaveBeenCalledWith('impactMedium')

		// With an empty queue, handleShuffle exits early without modifying the playlist
		expect(PlayerQueue.removeTrackFromPlaylist).not.toHaveBeenCalled()

		// setState is still called by toggleShuffle with the result from handleShuffle
		expect(usePlayerQueueStore.setState).toHaveBeenCalledWith(expect.any(Function))
	})

	it('handles single-track queue without crashing', async () => {
		const [track1] = createMockTracks(1)
		const setIsQueuing = jest.fn()

		;(usePlayerQueueStore.getState as jest.Mock).mockReturnValue({
			shuffled: false,
			currentIndex: 0,
			queue: [track1],
			setIsQueuing,
		})

		await toggleShuffle()

		expect(triggerHaptic).toHaveBeenCalledWith('impactMedium')

		// handleShuffle shows a toast and returns without modifying the playlist
		expect(PlayerQueue.removeTrackFromPlaylist).not.toHaveBeenCalled()
	})
})
