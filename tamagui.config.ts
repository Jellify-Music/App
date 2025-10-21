import { animations, tokens as TamaguiTokens, media, shorthands } from '@tamagui/config/v4'
import { createTamagui, createTokens } from 'tamagui' // or '@tamagui/core'
import { headingFont, bodyFont } from './fonts.config'

const tokens = createTokens({
	...TamaguiTokens,
	color: {
		danger: '#ff9966',
		purpleDark: '#0C0622',
		success: 'rgba(87, 233, 201, 1)',
		purple: '#100538',
		purpleGray: '#66617B',

		amethyst: 'rgba(126, 114, 175, 1)',
		amethyst25: 'rgba(126, 114, 175, 0.25)',
		amethyst50: 'rgba(126, 114, 175, 0.5)',
		amethyst75: 'rgba(126, 114, 175, 0.75)',

		secondary: '#cc2f71',

		primaryLight: '#6D2FFF',
		primaryDark: '#887BFF',
		white: '#ffffff',
		neutral: '#77748E',

		darkBackground: 'rgb(17, 16, 20)',
		darkBackground75: 'rgba(17, 16, 20, 0.75)',
		darkBackground50: 'rgba(17, 16, 20, 0.5)',
		darkBackground25: 'rgba(17, 16, 20, 0.25)',

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
			backgroundActive: tokens.color.amethyst,
			backgroundPress: tokens.color.amethyst,
			backgroundFocus: tokens.color.amethyst,
			backgroundHover: tokens.color.purpleGray,
			borderColor: tokens.color.neutral,
			color: tokens.color.white,
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryDark,
			danger: tokens.color.danger,
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
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryDark,
			danger: tokens.color.danger,
			neutral: tokens.color.neutral,

			translucent: tokens.color.darkTranslucent,
		},
		light: {
			background: tokens.color.white,
			background75: tokens.color.lightBackground75,
			background50: tokens.color.lightBackground50,
			background25: tokens.color.lightBackground25,
			backgroundActive: tokens.color.amethyst,
			borderColor: tokens.color.neutral,
			color: tokens.color.purpleDark,
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryLight,
			danger: tokens.color.danger,
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
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryLight,
			danger: tokens.color.danger,
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
