import {
	convertSecondsToRunTimeTicks,
	convertRunTimeTicksToSeconds,
} from '../../src/utils/mapping/ticks-to-seconds'

describe('convertSecondsToRunTimeTicks', () => {
	it('should convert 1 second to 10,000,000 ticks', () => {
		expect(convertSecondsToRunTimeTicks(1)).toBe(10000000)
	})

	it('should convert 0 seconds to 0 ticks', () => {
		expect(convertSecondsToRunTimeTicks(0)).toBe(0)
	})

	it('should convert 60 seconds to correct ticks', () => {
		expect(convertSecondsToRunTimeTicks(60)).toBe(600000000)
	})

	it('should handle fractional seconds', () => {
		expect(convertSecondsToRunTimeTicks(1.5)).toBe(15000000)
	})

	it('should handle large values (1 hour)', () => {
		expect(convertSecondsToRunTimeTicks(3600)).toBe(36000000000)
	})
})

describe('convertRunTimeTicksToSeconds', () => {
	it('should convert 10,000,000 ticks to 1 second', () => {
		expect(convertRunTimeTicksToSeconds(10000000)).toBe(1)
	})

	it('should convert 0 ticks to 0 seconds', () => {
		expect(convertRunTimeTicksToSeconds(0)).toBe(0)
	})

	it('should convert 600,000,000 ticks to 60 seconds', () => {
		expect(convertRunTimeTicksToSeconds(600000000)).toBe(60)
	})

	it('should floor the result (truncate fractional seconds)', () => {
		// 15,000,000 ticks = 1.5 seconds, should floor to 1
		expect(convertRunTimeTicksToSeconds(15000000)).toBe(1)
	})

	it('should handle large values (1 hour)', () => {
		expect(convertRunTimeTicksToSeconds(36000000000)).toBe(3600)
	})
})

describe('round-trip conversion', () => {
	it('should preserve whole seconds through round-trip', () => {
		const seconds = 120
		const ticks = convertSecondsToRunTimeTicks(seconds)
		const result = convertRunTimeTicksToSeconds(ticks)
		expect(result).toBe(seconds)
	})
})
