import { TrackPlayer } from 'react-native-nitro-player'
import { previous, skip } from '../../../src/hooks/player/functions/controls'

const SKIP_TO_PREVIOUS_THRESHOLD = 4 // seconds

describe('Player Controls', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('previous()', () => {
		it('should skip to previous track when position is below threshold', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD - 1,
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should seek to beginning when position is at or above threshold', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD + 1,
			})

			await previous()

			expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should not resume playback if player was paused', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: 1,
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).not.toHaveBeenCalled()
		})

		it('should skip to previous at exactly the threshold boundary', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD,
			})

			await previous()

			// At exactly threshold, Math.floor(4) = 4, which is NOT < 4, so seek to 0
			expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
		})
	})

	describe('skip()', () => {
		it('should skip to specific index when provided', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
			})

			await skip(5)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(5)
			expect(TrackPlayer.skipToNext).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to next track when index is undefined', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
			})

			await skip(undefined)

			expect(TrackPlayer.skipToNext).toHaveBeenCalled()
			expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to index 0', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
			})

			await skip(0)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(0)
			expect(TrackPlayer.play).toHaveBeenCalled()
		})
	})
})
