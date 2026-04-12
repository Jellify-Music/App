import { SKIP_TO_PREVIOUS_THRESHOLD } from '../../../src/configs/player.config'

// Dynamic require so jest.resetModules() gives each skip() test a fresh
// module with a clean isSkipInFlight flag (controls.ts:6).
let TrackPlayer: typeof import('react-native-nitro-player').TrackPlayer
let previous: typeof import('../../../src/hooks/player/functions/controls').previous
let skip: typeof import('../../../src/hooks/player/functions/controls').skip

function requireFresh() {
	;({ TrackPlayer } = require('react-native-nitro-player'))
	;({ previous, skip } = require('../../../src/hooks/player/functions/controls'))
}

describe('Player Controls', () => {
	describe('previous()', () => {
		beforeEach(() => {
			jest.clearAllMocks()
			requireFresh()
		})

		it('should skip to previous track when position is below threshold and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 1,
				currentPosition: SKIP_TO_PREVIOUS_THRESHOLD - 1,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).toHaveBeenCalled()
			expect(TrackPlayer.seek).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalledWith()
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
			expect(TrackPlayer.play).toHaveBeenCalledWith()
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
			expect(TrackPlayer.seek).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalledWith()
		})
	})

	describe('previous() edge cases', () => {
		beforeEach(() => {
			jest.clearAllMocks()
			requireFresh()
		})

		it('returns early when currentIndex is undefined', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: undefined,
				currentPosition: 0,
				currentState: 'playing',
			})

			await previous()

			expect(TrackPlayer.skipToPrevious).not.toHaveBeenCalled()
			expect(TrackPlayer.seek).not.toHaveBeenCalled()
		})
	})

	describe('skip()', () => {
		// Reset modules before each test to get a fresh isSkipInFlight flag.
		// The flag is module-level (controls.ts:6) and persists across tests.
		// Without this, a failed test could leave isSkipInFlight=true and
		// cause all subsequent skip() calls to silently return early.
		beforeEach(() => {
			jest.clearAllMocks()
			jest.resetModules()
			requireFresh()
		})

		it('should skip to specific index when provided and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'playing',
			})

			await skip(5)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(5)
			expect(TrackPlayer.skipToNext).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalledWith()
		})

		it('should skip to next track when index is undefined and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'paused',
			})

			await skip(undefined)

			expect(TrackPlayer.skipToNext).toHaveBeenCalled()
			expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
			expect(TrackPlayer.play).toHaveBeenCalledWith()
		})

		it('should skip to index 0 and start playback', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 2,
				currentState: 'paused',
			})

			await skip(0)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(0)
			expect(TrackPlayer.play).toHaveBeenCalledWith()
		})

		it('returns early when index equals currentIndex', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 5,
				currentState: 'playing',
			})

			await skip(5)

			expect(TrackPlayer.skipToIndex).not.toHaveBeenCalled()
			expect(TrackPlayer.play).not.toHaveBeenCalled()
		})

		it('guards against concurrent calls via isSkipInFlight', async () => {
			let resolveFirst: () => void
			const firstGetState = new Promise<void>((resolve) => {
				resolveFirst = resolve
			})

			;(TrackPlayer.getState as jest.Mock).mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveFirst!()
						setTimeout(() => resolve({ currentIndex: 0, currentState: 'playing' }), 50)
					}),
			)

			const first = skip(3)
			await firstGetState

			const second = skip(4)

			await Promise.all([first, second])

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledTimes(1)
			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(3)
		})

		it('resets isSkipInFlight even on error', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 0,
				currentState: 'playing',
			})
			;(TrackPlayer.skipToIndex as jest.Mock).mockRejectedValueOnce(new Error('Skip failed'))

			await expect(skip(3)).rejects.toThrow('Skip failed')

			// After the error, isSkipInFlight should be reset so a new call works
			;(TrackPlayer.skipToIndex as jest.Mock).mockResolvedValue(undefined)
			;(TrackPlayer.getState as jest.Mock).mockResolvedValue({
				currentIndex: 0,
				currentState: 'playing',
			})

			await skip(2)

			expect(TrackPlayer.skipToIndex).toHaveBeenCalledWith(2)
		})
	})
})
