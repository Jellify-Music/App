import { TrackPlayer } from 'react-native-nitro-player'
import { previous, skip } from '../../../src/hooks/player/functions/controls'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../src/configs/player.config'

describe('Player Controls', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('previous()', () => {
		it('should skip to previous track when position is below threshold and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD - 1,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should seek to beginning when position is at or above threshold and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
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
				currentPosition: 1,
				currentState: 'paused',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).not.toHaveBeenCalled()
		})

		it('should skip to previous at exactly the threshold boundary and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD,
				currentState: 'playing',
			})

			await previous()

			// At exactly threshold, Math.floor(4) = 4, which is NOT < 4, so seek to 0
			expect(TrackPlayer.seek).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
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
	})
})
