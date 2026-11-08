import { tokens as TamaguiTokens, media, shorthands, defaultSizing } from '@tamagui/config/v5'
import { animations } from '@tamagui/config/animations-reanimated'
import { createTamagui, createTokens } from 'tamagui'
import { headingFont, bodyFont } from './styling/fonts'
import { ColorPresetPalette } from '../types/theme'
import { COLOR_PRESETS, DISPLAY_MODES, PRESET_PALETTES } from './styling/themes'

const tokens = createTokens({
	...TamaguiTokens,
	color: {
		dangerDark: '#FF066F',
		dangerLight: '#B30077',
		warningDark: '#FF6625',
		warningLight: '#a93300ff',
		purpleDark: '#0C0622',
		tealLight: 'rgba(16, 175, 141, 1)',
		tealDark: 'rgba(87, 233, 201, 1)',
		purple: '#100538',
		purpleGray: '#66617B',

		amethyst: 'rgba(126, 114, 175, 1)',
		amethyst25: 'rgba(126, 114, 175, 0.25)',
		amethyst50: 'rgba(126, 114, 175, 0.5)',
		amethyst75: 'rgba(126, 114, 175, 0.75)',

		secondaryDark: 'rgba(75, 125, 215, 1)',
		secondaryLight: 'rgba(0, 58, 159, 1)',

		primaryLight: '#4b0fd6ff',
		primaryDark: '#887BFF',
		white: '#ffffff',
		neutral: '#77748E',
		offwhite: '#ececec',

		darkBackground: 'rgba(25, 24, 28, 1)',
		darkBackground75: 'rgba(25, 24, 28, 0.75)',
		darkBackground50: 'rgba(25, 24, 28, 0.5)',
		darkBackground25: 'rgba(25, 24, 28, 0.25)',

		darkBorder: '#CEAAFF',

		lightBackground: 'rgb(235, 221, 255)',
		lightBackground75: 'rgba(235, 221, 255, 0.75)',
		lightBackground50: 'rgba(235, 221, 255, 0.5)',
		lightBackground25: 'rgba(235, 221, 255, 0.25)',

		black: '#000000',
		black10: 'rgba(0, 0, 0, 0.1)',
		black25: 'rgba(0, 0, 0, 0.25)',
		black50: 'rgba(0, 0, 0, 0.5)',
		black75: 'rgba(0, 0, 0, 0.75)',

		lightTranslucent: 'rgba(255, 255, 255, 0.75)',
		darkTranslucent: 'rgba(0, 0, 0, 0.5)',
	},
})

/**
 * Tamagui v3 components (ToggleGroup items, interactive frames, etc.) style their
 * interaction states with kebab-case theme keys like `press:border-color-press`.
 * Derive those from each palette so they never resolve to undefined.
 */
const withInteractionStates = (palette: ColorPresetPalette) => ({
	...palette,
	'border-color': palette.borderColor,
	'border-color-hover': palette.primary,
	'border-color-press': palette.primary,
	'border-color-focus': palette.primary,
	'background-hover': palette.background75,
	'background-press': palette.background,
	'background-focus': palette.background75,
	'color-hover': palette.color,
	'color-press': palette.color,
	'color-focus': palette.color,
	'outline-color': palette.primary,
	'placeholder-color': palette.neutral,
	'shadow-color': palette.translucent,
})

const themes: Record<string, ReturnType<typeof withInteractionStates>> = {}
for (const preset of COLOR_PRESETS) {
	for (const mode of DISPLAY_MODES) {
		themes[`${preset}_${mode}`] = withInteractionStates(PRESET_PALETTES[preset][mode])
	}
}

const jellifyConfig = createTamagui({
	sizing: defaultSizing,
	animations,
	fonts: {
		heading: headingFont,
		body: bodyFont,
	},
	media,
	shorthands,
	tokens,
	themes,
	settings: {
		defaultFont: 'body',
	},
})

export type JellifyConfig = typeof jellifyConfig

declare module 'tamagui' {
	// or '@tamagui/core'
	// overrides TamaguiCustomConfig so your custom types
	// work everywhere you import `tamagui`
	interface TamaguiCustomConfig extends JellifyConfig {}
}

export default jellifyConfig
