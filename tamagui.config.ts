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

const jellifyConfig = createTamagui({
	animations,
	fonts: {
		heading: headingFont,
		body: bodyFont,
	},
	media,
	shorthands,
	tokens,
	themes: {
		dark: {
			background: tokens.color.darkBackground,
			background75: tokens.color.darkBackground75,
			background50: tokens.color.darkBackground50,
			background25: tokens.color.darkBackground25,
			borderColor: tokens.color.neutral,
			color: tokens.color.white,
			success: tokens.color.tealDark,
			secondary: tokens.color.secondaryDark,
			primary: tokens.color.primaryDark,
			danger: tokens.color.dangerDark,
			warning: tokens.color.warningDark,
			neutral: tokens.color.neutral,

			translucent: tokens.color.darkTranslucent,
		},
		oled: {
			// True black OLED theme
			background: tokens.color.black,
			background75: tokens.color.black75,
			background50: tokens.color.black50,
			background25: tokens.color.black25,
			borderColor: tokens.color.neutral,
			color: tokens.color.white,
			success: tokens.color.tealDark,
			secondary: tokens.color.secondaryDark,
			primary: tokens.color.primaryDark,
			danger: tokens.color.dangerDark,
			warning: tokens.color.warningDark,
			neutral: tokens.color.neutral,

			translucent: tokens.color.darkTranslucent,
		},
		dark_inverted_purple: {
			color: tokens.color.purpleDark,
			borderColor: tokens.color.amethyst,
			background: tokens.color.amethyst,
			background25: tokens.color.amethyst25,
			background50: tokens.color.amethyst50,
			background75: tokens.color.amethyst75,
			success: tokens.color.tealDark,
			secondary: tokens.color.secondaryDark,
			primary: tokens.color.primaryDark,
			danger: tokens.color.dangerDark,
			warning: tokens.color.warningDark,
			neutral: tokens.color.neutral,

			translucent: tokens.color.darkTranslucent,
		},
		light: {
			background: tokens.color.white,
			background75: tokens.color.lightBackground75,
			background50: tokens.color.lightBackground50,
			background25: tokens.color.lightBackground25,
			borderColor: tokens.color.neutral,
			color: tokens.color.purpleDark,
			success: tokens.color.tealLight,
			secondary: tokens.color.secondaryLight,
			primary: tokens.color.primaryLight,
			danger: tokens.color.dangerLight,
			warning: tokens.color.warningLight,
			neutral: tokens.color.neutral,

			translucent: tokens.color.lightTranslucent,
		},
		light_inverted_purple: {
			color: tokens.color.purpleDark,
			borderColor: tokens.color.neutral,
			background: tokens.color.amethyst,
			background25: tokens.color.amethyst25,
			background50: tokens.color.amethyst50,
			background75: tokens.color.amethyst75,
			success: tokens.color.tealLight,
			secondary: tokens.color.secondaryLight,
			primary: tokens.color.primaryLight,
			danger: tokens.color.dangerLight,
			warning: tokens.color.warningLight,
			neutral: tokens.color.neutral,

			translucent: tokens.color.lightTranslucent,
		},
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
