import { previous, skip } from '../../../src/hooks/player/functions/controls'
import TrackPlayer, { State } from 'react-native-track-player'
import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../src/configs/player.config'

describe('Player Controls', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('previous()', () => {
		it('should skip to previous track when position is below threshold', async () => {
			;(TrackPlayer.getProgress as jest.Mock).mockResolvedValue({
				position: SKIP_TO_PREVIOUS_THRESHOLD - 1,
			})
			;(TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
				state: State.Playing,
			})

			await previous()

			expect(TrackPlayer.stop).toHaveBeenCalled()
			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should seek to beginning when position is at or above threshold', async () => {
			;(TrackPlayer.getProgress as jest.Mock).mockResolvedValue({
				position: SKIP_TO_PREVIOUS_THRESHOLD + 1,
			})
			;(TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
				state: State.Playing,
			})

			await previous()

			expect(TrackPlayer.seekTo).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should not resume playback if player was paused', async () => {
			;(TrackPlayer.getProgress as jest.Mock).mockResolvedValue({
				position: 1,
			})
			;(TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
				state: State.Paused,
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.play).not.toHaveBeenCalled()
		})

		it('should skip to previous at exactly the threshold boundary', async () => {
			;(TrackPlayer.getProgress as jest.Mock).mockResolvedValue({
				position: SKIP_TO_PREVIOUS_THRESHOLD,
			})
			;(TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
				state: State.Paused,
			})

			await previous()

			// At exactly threshold, Math.floor(4) = 4, which is NOT < 4, so seek to 0
			expect(TrackPlayer.seekTo).toHaveBeenCalledWith(0)
			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
		})
	})

	describe('skip()', () => {
		it('should skip to specific index when provided', async () => {
			await skip(5)

			expect(TrackPlayer.skip).toHaveBeenCalledWith(5)
			expect(TrackPlayer.skipToNext).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to next track when index is undefined', async () => {
			await skip(undefined)

			expect(TrackPlayer.skipToNext).toHaveBeenCalled()
			expect(TrackPlayer.skip).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalled()
		})

		it('should skip to index 0', async () => {
			await skip(0)

			expect(TrackPlayer.skip).toHaveBeenCalledWith(0)
			expect(TrackPlayer.play).toHaveBeenCalled()
		})
	})
})
