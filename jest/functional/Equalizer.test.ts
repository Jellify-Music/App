import {
	EQ_GAIN_MAX,
	EQ_GAIN_MIN,
	EQ_SLIDER_MAX,
	dbToSliderValue,
	formatGainLabel,
	sliderValueToDb,
} from '../../src/utils/audio/equalizer'

describe('Equalizer Mapping Module', () => {
	it('maps slider extremes and midpoint to dB', () => {
		expect(sliderValueToDb(0)).toBe(EQ_GAIN_MIN)
		expect(sliderValueToDb(EQ_SLIDER_MAX)).toBe(EQ_GAIN_MAX)
		expect(sliderValueToDb(EQ_SLIDER_MAX / 2)).toBe(0)
	})

	it('rounds slider values to 0.5 dB steps', () => {
		expect(sliderValueToDb(13.3)).toBe(1.5)
		expect(sliderValueToDb(13.2)).toBe(1)
		expect(sliderValueToDb(11.75)).toBe(0)
	})

	it('clamps out-of-range slider values', () => {
		expect(sliderValueToDb(-1)).toBe(EQ_GAIN_MIN)
		expect(sliderValueToDb(EQ_SLIDER_MAX + 1)).toBe(EQ_GAIN_MAX)
	})

	it('maps dB to slider position without rounding', () => {
		expect(dbToSliderValue(EQ_GAIN_MIN)).toBe(0)
		expect(dbToSliderValue(0)).toBe(EQ_SLIDER_MAX / 2)

		// Built-in presets use fractional gains, e.g. Rock boosts 31 Hz by 4.8 dB
		expect(dbToSliderValue(4.8)).toBeCloseTo(16.8, 10)
	})

	it('clamps out-of-range gains', () => {
		expect(dbToSliderValue(EQ_GAIN_MIN - 1)).toBe(0)
		expect(dbToSliderValue(EQ_GAIN_MAX + 1)).toBe(EQ_SLIDER_MAX)
	})

	it('round-trips step-aligned gains', () => {
		for (const gainDb of [-12, -2.5, 0, 0.5, 12]) {
			expect(sliderValueToDb(dbToSliderValue(gainDb))).toBe(gainDb)
		}
	})

	it('formats gain labels', () => {
		expect(formatGainLabel(3)).toBe('+3.0 dB')
		expect(formatGainLabel(-2.5)).toBe('-2.5 dB')
		expect(formatGainLabel(12)).toBe('+12.0 dB')
		expect(formatGainLabel(0)).toBe('0 dB')
	})

	it('treats negative zero and float dust as flat', () => {
		expect(formatGainLabel(-0)).toBe('0 dB')
		expect(formatGainLabel(0.04)).toBe('0 dB')
		expect(sliderValueToDb(12.1)).toBe(0)
		expect(Object.is(sliderValueToDb(11.9), 0)).toBe(true)
	})
})
