import { animations, tokens as TamaguiTokens, media, shorthands } from '@tamagui/config/v4'
import { createTamagui, createTokens } from 'tamagui' // or '@tamagui/core'
import { headingFont, bodyFont } from './fonts.config'

const tokens = createTokens({
	...TamaguiTokens,
	color: {
		danger: '#ff9966',
		purpleDark: '#0C0622',
		success: '#00bb5e',
		successDark: '#99ffcc',
		purple: '#100538',
		purpleGray: '#66617B',
		amethyst: '#7E72AF',

		secondary: '#cc2f71',

		primaryLight: '#6D2FFF',
		primaryDark: '#887BFF',
		white: '#ffffff',
		neutral: '#77748E',
		darkBackground: '#111014',
		darkBorder: '#CEAAFF',
		lightBackground: '#EBDDFF',
		black: '#000000',
		black10: 'rgba(0, 0, 0, 0.1)',
		black25: 'rgba(0, 0, 0, 0.25)',
		black50: 'rgba(0, 0, 0, 0.5)',
		black75: 'rgba(0, 0, 0, 0.75)',
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
			backgroundActive: tokens.color.amethyst,
			backgroundPress: tokens.color.amethyst,
			backgroundFocus: tokens.color.amethyst,
			backgroundHover: tokens.color.purpleGray,
			borderColor: tokens.color.neutral,
			color: tokens.color.white,
			success: tokens.color.successDark,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryDark,
			danger: tokens.color.danger,
			neutral: tokens.color.neutral,
		},
		dark_inverted_purple: {
			color: tokens.color.purpleDark,
			borderColor: tokens.color.amethyst,
			background: tokens.color.amethyst,
			success: tokens.color.successDark,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryDark,
			danger: tokens.color.danger,
			neutral: tokens.color.neutral,
		},
		light: {
			background: tokens.color.white,
			backgroundActive: tokens.color.amethyst,
			borderColor: tokens.color.neutral,
			color: tokens.color.purpleDark,
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryLight,
			danger: tokens.color.danger,
			neutral: tokens.color.neutral,
		},
		light_inverted_purple: {
			color: tokens.color.purpleDark,
			borderColor: tokens.color.neutral,
			background: tokens.color.purpleGray,
			success: tokens.color.success,
			secondary: tokens.color.secondary,
			primary: tokens.color.primaryLight,
			danger: tokens.color.danger,
			neutral: tokens.color.neutral,
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
