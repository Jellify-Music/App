import isPlaybackFinished from '../../src/api/mutations/playback/utils'

describe('isPlaybackFinished', () => {
	it('should return true when position is over 80% of duration', () => {
		// 85 seconds into a 100 second track = 85%
		expect(isPlaybackFinished(85, 100)).toBe(true)
	})

	it('should return true when position is exactly at 80.1%', () => {
		expect(isPlaybackFinished(80.1, 100)).toBe(true)
	})

	it('should return false when position is exactly at 80%', () => {
		// Edge case: exactly 80% should NOT be considered finished
		expect(isPlaybackFinished(80, 100)).toBe(false)
	})

	it('should return false when position is under 80%', () => {
		expect(isPlaybackFinished(70, 100)).toBe(false)
	})

	it('should return false when position is at halfway point', () => {
		expect(isPlaybackFinished(50, 100)).toBe(false)
	})

	it('should return true when track is complete', () => {
		expect(isPlaybackFinished(100, 100)).toBe(true)
	})

	it('should handle real-world decimal values', () => {
		// Simulating a real track playback scenario
		const duration = 234.567 // 3:54.567
		const position = 200.5 // ~85.5% through

		expect(isPlaybackFinished(position, duration)).toBe(true)
	})

	it('should handle very short tracks', () => {
		// 5 second track, 4.5 seconds in = 90%
		expect(isPlaybackFinished(4.5, 5)).toBe(true)
	})

	it('should handle edge case of zero duration', () => {
		// This would result in Infinity (division by zero)
		// The function should handle this gracefully - Infinity > 0.8 is true
		expect(isPlaybackFinished(10, 0)).toBe(true)
	})

	it('should handle edge case of zero position', () => {
		expect(isPlaybackFinished(0, 100)).toBe(false)
	})
})
