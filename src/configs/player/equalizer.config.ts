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
 * The interval in decibels between the notches drawn along a band slider,
 * marking every other {@link EQ_GAIN_STEP}.
 */
export const EQ_NOTCH_INTERVAL = EQ_GAIN_STEP * 4
