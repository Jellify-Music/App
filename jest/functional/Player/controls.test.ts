import { TrackPlayer } from 'react-native-nitro-player'
import { previous, skip } from '../../../src/player/controls'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../src/configs/player/index.config'
import { usePlayerQueueStore } from '../../../src/stores/player/queue'

describe('Player Controls', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		usePlayerQueueStore.setState({ repeatMode: 'off' })
		;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([])
	})

	describe('previous()', () => {
		it('should skip to previous track when position is below threshold and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD - 1,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should seek to beginning when position is at or above threshold and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD + 1,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should not resume playback if player was paused', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentPosition: 1,
				currentState: 'paused',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).not.toHaveBeenCalled()
		})

		it('should skip to previous at exactly the threshold boundary and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})
	})

	describe('skip()', () => {
		it('should skip to specific index when provided and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'playing',
			})

			await skip(5)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(5)
			expect(TrackPlayer.skipToNext).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to next track when index is undefined and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'paused',
			})

			await skip(undefined)

			expect(TrackPlayer.skipToNext).toHaveBeenCalled()
			expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to index 0 and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'paused',
			})

			await skip(0)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(0)
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should wrap to the first track when skipping past the last track with repeat all', async () => {
			usePlayerQueueStore.setState({ repeatMode: 'Playlist' })
			;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([
				{ id: 'a' },
				{ id: 'b' },
				{ id: 'c' },
			])
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'playing',
			})

			await skip(undefined)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToNext).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to next normally on the last track when repeat is off', async () => {
			;(TrackPlayer.getActualQueue as jest.Mock).mockResolvedValue([{ id: 'a' }, { id: 'b' }])
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentState: 'playing',
			})

			await skip(undefined)

			expect(TrackPlayer.skipToNext).toHaveBeenCalled()
			expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
		})
	})
})
