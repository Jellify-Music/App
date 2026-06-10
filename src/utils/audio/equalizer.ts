/**
 * The minimum gain in decibels that can be applied to an equalizer band.
 */
export const EQ_GAIN_MIN = -12

/**
 * The maximum gain in decibels that can be applied to an equalizer band.
 */
export const EQ_GAIN_MAX = 12

/**
 * The maximum value of a band slider.
 *
 * Band sliders run from zero to this value since the slider component
 * doesn't support negative values, so slider values are shifted by
 * {@link EQ_GAIN_MIN} to get the gain in decibels.
 */
export const EQ_SLIDER_MAX = EQ_GAIN_MAX - EQ_GAIN_MIN

/**
 * The step in decibels that band gains are rounded to when committed.
 */
export const EQ_GAIN_STEP = 0.5

/**
 * Converts a band slider value to a gain in decibels.
 *
 * The value is clamped to the slider range, shifted into the gain range,
 * and rounded to the nearest {@link EQ_GAIN_STEP}.
 *
 * @param value - The slider value to convert.
 * @returns The gain in decibels.
 */
export function sliderValueToDb(value: number): number {
	const clamped = Math.min(EQ_SLIDER_MAX, Math.max(0, value))

	const stepped = Math.round((clamped + EQ_GAIN_MIN) / EQ_GAIN_STEP) * EQ_GAIN_STEP

	// Normalize negative zero so labels and equality checks behave
	return stepped === 0 ? 0 : stepped
}

/**
 * Converts a gain in decibels to a band slider value.
 *
 * The gain is clamped to the gain range but deliberately not rounded,
 * so the fractional gains used by built-in presets position the slider
 * thumb accurately.
 *
 * @param gainDb - The gain in decibels to convert.
 * @returns The slider value.
 */
export function dbToSliderValue(gainDb: number): number {
	const clamped = Math.min(EQ_GAIN_MAX, Math.max(EQ_GAIN_MIN, gainDb))

	return clamped - EQ_GAIN_MIN
}

/**
 * Formats a band gain as a user-facing label, e.g. "+3.0 dB", "-2.5 dB" or "0 dB".
 *
 * Gains within a twentieth of a decibel of flat are treated as zero so that
 * negative zero and float dust from native preset gains don't render as "-0.0 dB".
 *
 * @param gainDb - The gain in decibels to format.
 * @returns The formatted gain label.
 */
export function formatGainLabel(gainDb: number): string {
	if (Math.abs(gainDb) < 0.05) return '0 dB'

	return `${gainDb > 0 ? '+' : '-'}${Math.abs(gainDb).toFixed(1)} dB`
}
