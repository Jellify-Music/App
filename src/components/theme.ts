import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import type { Theme } from '@react-navigation/native'
import { PRESET_PALETTES } from '../../tamagui.config'
import type { ColorPreset } from '../stores/settings/app'

interface Fonts {
	regular: FontStyle
	medium: FontStyle
	bold: FontStyle
	heavy: FontStyle
}

interface FontStyle {
	fontFamily: string
	fontWeight:
		| 'normal'
		| 'bold'
		| '200'
		| '900'
		| '100'
		| '500'
		| '300'
		| '400'
		| '600'
		| '700'
		| '800'
}

const JellifyFonts: Fonts = {
	regular: {
		fontFamily: 'Figtree-Regular',
		fontWeight: 'normal',
	},
	medium: {
		fontFamily: 'Figtree-Medium',
		fontWeight: 'normal',
	},
	bold: {
		fontFamily: 'Figtree-Bold',
		fontWeight: 'bold',
	},
	heavy: {
		fontFamily: 'Figtree-Black',
		fontWeight: 'bold',
	},
}

function paletteToNavTheme(
	palette: (typeof PRESET_PALETTES)['purple']['dark'],
	dark: boolean,
): Theme {
	const base = dark ? DarkTheme : DefaultTheme
	return {
		...base,
		dark,
		colors: {
			...base.colors,
			background: palette.background,
			card: palette.background,
			border: palette.borderColor,
			primary: palette.primary,
		},
		fonts: JellifyFonts,
	}
}

/** React Navigation theme for a given color preset and mode (purple_dark, ocean_light, etc.) */
export function getJellifyNavTheme(preset: ColorPreset, mode: 'light' | 'dark' | 'oled'): Theme {
	const palette = PRESET_PALETTES[preset][mode]
	return paletteToNavTheme(palette, mode !== 'light')
}

/** Purple dark — matches Tamagui purple_dark (current JellifyDarkTheme) */
export const JellifyDarkTheme: Theme = paletteToNavTheme(PRESET_PALETTES.purple.dark, true)

/** Purple light — matches Tamagui purple_light (current JellifyLightTheme) */
export const JellifyLightTheme: Theme = paletteToNavTheme(PRESET_PALETTES.purple.light, false)

/** Purple oled — matches Tamagui purple_oled (current JellifyOLEDTheme) */
export const JellifyOLEDTheme: Theme = paletteToNavTheme(PRESET_PALETTES.purple.oled, true)
