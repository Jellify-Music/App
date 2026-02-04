import { animations, tokens as TamaguiTokens, media, shorthands } from '@tamagui/config/v4'
import { createTamagui, createTokens } from 'tamagui' // or '@tamagui/core'
import { headingFont, bodyFont } from './fonts.config'

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

/** Theme mode palette: semantic keys used by Tamagui and React Navigation */
type PresetModePalette = {
	background: string
	background75: string
	background50: string
	background25: string
	borderColor: string
	color: string
	success: string
	secondary: string
	primary: string
	danger: string
	warning: string
	neutral: string
	translucent: string
}

/** Palettes per preset (purple = current Jellify themes), for Tamagui + nav */
export const PRESET_PALETTES: Record<
	'purple' | 'ocean' | 'forest' | 'sunset' | 'peanut',
	{ light: PresetModePalette; dark: PresetModePalette; oled: PresetModePalette }
> = {
	purple: {
		// Matches current JellifyDarkTheme / JellifyLightTheme / JellifyOLEDTheme
		dark: {
			background: 'rgba(25, 24, 28, 1)',
			background75: 'rgba(25, 24, 28, 0.75)',
			background50: 'rgba(25, 24, 28, 0.5)',
			background25: 'rgba(25, 24, 28, 0.25)',
			borderColor: '#77748E',
			color: '#ffffff',
			success: 'rgba(87, 233, 201, 1)',
			secondary: 'rgba(75, 125, 215, 1)',
			primary: '#887BFF',
			danger: '#FF066F',
			warning: '#FF6625',
			neutral: '#77748E',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
		light: {
			background: '#ffffff',
			background75: 'rgba(235, 221, 255, 0.75)',
			background50: 'rgba(235, 221, 255, 0.5)',
			background25: 'rgba(235, 221, 255, 0.25)',
			borderColor: '#77748E',
			color: '#0C0622',
			success: 'rgba(16, 175, 141, 1)',
			secondary: 'rgba(0, 58, 159, 1)',
			primary: '#4b0fd6ff',
			danger: '#B30077',
			warning: '#a93300ff',
			neutral: '#77748E',
			translucent: 'rgba(255, 255, 255, 0.75)',
		},
		oled: {
			background: '#000000',
			background75: 'rgba(0, 0, 0, 0.75)',
			background50: 'rgba(0, 0, 0, 0.5)',
			background25: 'rgba(0, 0, 0, 0.25)',
			borderColor: '#77748E',
			color: '#ffffff',
			success: 'rgba(87, 233, 201, 1)',
			secondary: 'rgba(75, 125, 215, 1)',
			primary: '#887BFF',
			danger: '#FF066F',
			warning: '#FF6625',
			neutral: '#77748E',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
	},
	ocean: {
		dark: {
			background: 'rgba(25, 24, 28, 1)',
			background75: 'rgba(25, 24, 28, 0.75)',
			background50: 'rgba(25, 24, 28, 0.5)',
			background25: 'rgba(25, 24, 28, 0.25)',
			borderColor: '#78909C',
			color: '#ffffff',
			success: '#4DD0E1',
			secondary: '#81D4FA',
			primary: '#4FC3F7',
			danger: '#FF7043',
			warning: '#FFB74D',
			neutral: '#78909C',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
		light: {
			background: '#E1F5FE',
			background75: 'rgba(225, 245, 254, 0.75)',
			background50: 'rgba(225, 245, 254, 0.5)',
			background25: 'rgba(225, 245, 254, 0.25)',
			borderColor: '#546E7A',
			color: '#01579B',
			success: '#00838F',
			secondary: '#0277BD',
			primary: '#0288D1',
			danger: '#D84315',
			warning: '#EF6C00',
			neutral: '#546E7A',
			translucent: 'rgba(255, 255, 255, 0.75)',
		},
		oled: {
			background: '#000000',
			background75: 'rgba(0, 0, 0, 0.75)',
			background50: 'rgba(0, 0, 0, 0.5)',
			background25: 'rgba(0, 0, 0, 0.25)',
			borderColor: '#78909C',
			color: '#ffffff',
			success: '#4DD0E1',
			secondary: '#81D4FA',
			primary: '#4FC3F7',
			danger: '#FF7043',
			warning: '#FFB74D',
			neutral: '#78909C',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
	},
	forest: {
		dark: {
			background: 'rgb(35, 47, 35)',
			background75: 'rgba(35, 47, 35, 0.75)',
			background50: 'rgba(35, 47, 35, 0.5)',
			background25: 'rgba(35, 47, 35, 0.25)',
			borderColor: '#8D9E8C',
			color: '#ffffff',
			success: '#66BB6A',
			secondary: '#9CCC65',
			primary: 'rgb(56, 105, 56)',
			danger: '#E57373',
			warning: '#FFB74D',
			neutral: '#8D9E8C',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
		light: {
			background: '#E8F5E9',
			background75: 'rgba(232, 245, 233, 0.75)',
			background50: 'rgba(232, 245, 233, 0.5)',
			background25: 'rgba(232, 245, 233, 0.25)',
			borderColor: '#558B2F',
			color: '#1B5E20',
			success: '#2E7D32',
			secondary: '#43A047',
			primary: 'rgb(14, 143, 21)',
			danger: '#C62828',
			warning: '#E65100',
			neutral: '#558B2F',
			translucent: 'rgba(255, 255, 255, 0.75)',
		},
		oled: {
			background: '#000000',
			background75: 'rgba(0, 0, 0, 0.75)',
			background50: 'rgba(0, 0, 0, 0.5)',
			background25: 'rgba(0, 0, 0, 0.25)',
			borderColor: '#8D9E8C',
			color: '#ffffff',
			success: '#66BB6A',
			secondary: '#9CCC65',
			primary: 'rgb(11, 128, 17)',
			danger: '#E57373',
			warning: '#FFB74D',
			neutral: '#8D9E8C',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
	},
	sunset: {
		dark: {
			background: 'rgb(52, 34, 28)',
			background75: 'rgba(52, 34, 28, 0.75)',
			background50: 'rgba(52, 34, 28, 0.5)',
			background25: 'rgba(52, 34, 28, 0.25)',
			borderColor: '#A1887F',
			color: '#ffffff',
			success: '#FFAB91',
			secondary: '#FF8A65',
			primary: '#FF7043',
			danger: '#EF5350',
			warning: '#FFCA28',
			neutral: '#A1887F',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
		light: {
			background: '#FFF3E0',
			background75: 'rgba(255, 243, 224, 0.75)',
			background50: 'rgba(255, 243, 224, 0.5)',
			background25: 'rgba(255, 243, 224, 0.25)',
			borderColor: '#BF360C',
			color: '#3E2723',
			success: '#E64A19',
			secondary: '#FF5722',
			primary: '#FF5722',
			danger: '#B71C1C',
			warning: '#F57C00',
			neutral: '#BF360C',
			translucent: 'rgba(255, 255, 255, 0.75)',
		},
		oled: {
			background: '#000000',
			background75: 'rgba(0, 0, 0, 0.75)',
			background50: 'rgba(0, 0, 0, 0.5)',
			background25: 'rgba(0, 0, 0, 0.25)',
			borderColor: '#A1887F',
			color: '#ffffff',
			success: '#FFAB91',
			secondary: '#FF8A65',
			primary: '#FF7043',
			danger: '#EF5350',
			warning: '#FFCA28',
			neutral: '#A1887F',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
	},
	peanut: {
		dark: {
			background: 'rgba(62, 39, 22, 1)',
			background75: 'rgba(62, 39, 22, 0.75)',
			background50: 'rgba(62, 39, 22, 0.5)',
			background25: 'rgba(62, 39, 22, 0.25)',
			borderColor: '#BCAAA4',
			color: '#ffffff',
			success: '#D7CCC8',
			secondary: '#A1887F',
			primary: '#D7CCC8',
			danger: '#8D6E63',
			warning: '#FFAB91',
			neutral: '#BCAAA4',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
		light: {
			background: '#EFEBE9',
			background75: 'rgba(239, 235, 233, 0.75)',
			background50: 'rgba(239, 235, 233, 0.5)',
			background25: 'rgba(239, 235, 233, 0.25)',
			borderColor: '#6D4C41',
			color: '#3E2723',
			success: '#5D4037',
			secondary: '#795548',
			primary: '#8D6E63',
			danger: '#4E342E',
			warning: '#BF360C',
			neutral: '#6D4C41',
			translucent: 'rgba(255, 255, 255, 0.75)',
		},
		oled: {
			background: '#000000',
			background75: 'rgba(0, 0, 0, 0.75)',
			background50: 'rgba(0, 0, 0, 0.5)',
			background25: 'rgba(0, 0, 0, 0.25)',
			borderColor: '#BCAAA4',
			color: '#ffffff',
			success: '#D7CCC8',
			secondary: '#A1887F',
			primary: '#D7CCC8',
			danger: '#8D6E63',
			warning: '#FFAB91',
			neutral: '#BCAAA4',
			translucent: 'rgba(0, 0, 0, 0.5)',
		},
	},
}

const presetNames = ['purple', 'ocean', 'forest', 'sunset', 'peanut'] as const

const themes: Record<string, PresetModePalette> = {}
for (const preset of presetNames) {
	for (const mode of ['light', 'dark', 'oled'] as const) {
		themes[`${preset}_${mode}`] = PRESET_PALETTES[preset][mode]
	}
}

const jellifyConfig = createTamagui({
	animations,
	fonts: {
		heading: headingFont,
		body: bodyFont,
	},
	media,
	shorthands,
	tokens,
	themes,
})

export type JellifyConfig = typeof jellifyConfig

declare module 'tamagui' {
	// or '@tamagui/core'
	// overrides TamaguiCustomConfig so your custom types
	// work everywhere you import `tamagui`
	interface TamaguiCustomConfig extends JellifyConfig {}
}

export default jellifyConfig
