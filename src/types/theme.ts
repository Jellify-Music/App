/**
 * The appearance setting for the app, which can either match the system setting or be a specific display mode.
 */
export type Appearance = 'system' | DisplayMode

/**
 * The specific display mode for the app, which can be light, dark, or OLED.
 */
export type DisplayMode = 'light' | 'dark' | 'oled'

/**
 * Theme mode palette: semantic keys used by Tamagui and React Navigation
 */
export type ColorPresetPalette = {
	/**
	 * Tbe background color
	 */
	background: string

	/**
	 * The background color, at 75% opacity
	 */
	background75: string

	/**
	 * The background color, at 50% opacity
	 */
	background50: string

	/**
	 * The background color, at 25% opacity
	 */
	background25: string

	/**
	 * The border color for UI elements.
	 */
	borderColor: string
	/**
	 * The primary text color for UI elements.
	 */
	color: string

	/**
	 * The color used to indicate success.
	 */
	success: string

	/**
	 * The secondary text color for UI elements.
	 */
	secondary: string

	/**
	 * The primary color for UI elements.
	 */
	primary: string

	/**
	 * The color used to indicate danger or errors.
	 */
	danger: string

	/**
	 * The color used to indicate warnings.
	 */
	warning: string

	/**
	 * The neutral color for UI elements.
	 */
	neutral: string

	/**
	 * The translucent color for UI elements.
	 */
	translucent: string

	/**
	 * The color used for play buttons.
	 */
	play: string

	/**
	 * The text color for album buttons.
	 */
	albumButtonText: string

	/**
	 * The background color for album buttons.
	 */
	albumButtonBackground: string
}

/**
 * The available color presets for Jellify's theme.
 */
export type ColorPreset = 'haze' | 'ocean' | 'forest' | 'sunset' | 'peanut'

/**
 * The palettes for each color preset, including light, dark, and OLED variants.
 */
export type PresetPalettes = Record<
	ColorPreset,
	{ light: ColorPresetPalette; dark: ColorPresetPalette; oled: ColorPresetPalette }
>
