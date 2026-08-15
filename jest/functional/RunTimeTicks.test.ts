import {
	convertSecondsToRunTimeTicks,
	convertRunTimeTicksToSeconds,
} from '../../src/utils/mapping/ticks-to-seconds'

describe('RunTimeTicks Conversion', () => {
	describe('convertSecondsToRunTimeTicks', () => {
		it('should convert 0 seconds to 0 ticks', () => {
			const result = convertSecondsToRunTimeTicks(0)
			expect(result).toBe(0)
		})

		it('should convert 1 second to 10,000,000 ticks', () => {
			const result = convertSecondsToRunTimeTicks(1)
			expect(result).toBe(10000000)
		})

		it('should convert 60 seconds to 600,000,000 ticks', () => {
			const result = convertSecondsToRunTimeTicks(60)
			expect(result).toBe(600000000)
		})

		it('should convert 3661 seconds (1 hour, 1 minute, 1 second) to correct ticks', () => {
			const result = convertSecondsToRunTimeTicks(3661)
			expect(result).toBe(36610000000)
		})

		it('should handle decimal seconds', () => {
			const result = convertSecondsToRunTimeTicks(1.5)
			expect(result).toBe(15000000)
		})

		it('should handle large numbers', () => {
			const result = convertSecondsToRunTimeTicks(86400) // 24 hours
			expect(result).toBe(864000000000)
		})
	})

	describe('convertRunTimeTicksToSeconds', () => {
		it('should convert 0 ticks to 0 seconds', () => {
			const result = convertRunTimeTicksToSeconds(0)
			expect(result).toBe(0)
		})

		it('should convert 10,000,000 ticks to 1 second', () => {
			const result = convertRunTimeTicksToSeconds(10000000)
			expect(result).toBe(1)
		})

		it('should convert 600,000,000 ticks to 60 seconds', () => {
			const result = convertRunTimeTicksToSeconds(600000000)
			expect(result).toBe(60)
		})

		it('should convert 36610000000 ticks to 3661 seconds (1 hour, 1 minute, 1 second)', () => {
			const result = convertRunTimeTicksToSeconds(36610000000)
			expect(result).toBe(3661)
		})

		it('should round up fractional seconds', () => {
			const result = convertRunTimeTicksToSeconds(5000000) // 0.5 seconds
			expect(result).toBe(1) // Should round up to 1
		})

		it('should handle large numbers', () => {
			const result = convertRunTimeTicksToSeconds(864000000000) // 24 hours
			expect(result).toBe(86400)
		})
	})

	describe('Round-trip conversion', () => {
		it('should convert seconds to ticks and back', () => {
			const originalSeconds = 120
			const ticks = convertSecondsToRunTimeTicks(originalSeconds)
			const convertedBack = convertRunTimeTicksToSeconds(ticks)
			expect(convertedBack).toBe(originalSeconds)
		})

		it('should maintain accuracy for various common durations', () => {
			const testCases = [0, 1, 10, 60, 180, 300, 3600, 7200]
			testCases.forEach((seconds) => {
				const ticks = convertSecondsToRunTimeTicks(seconds)
				const convertedBack = convertRunTimeTicksToSeconds(ticks)
				expect(convertedBack).toBe(seconds)
			})
		})
	})
})
