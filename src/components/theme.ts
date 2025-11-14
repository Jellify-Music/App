import { DarkTheme, DefaultTheme } from '@react-navigation/native'
import { getToken, getTokens } from 'tamagui'

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

export const JellifyDarkTheme: ReactNavigation.Theme = {
	dark: true,
	colors: {
		...DarkTheme.colors,
		card: getTokens().color.$darkBackground.val,
		border: getTokens().color.$neutral.val,
		background: getTokens().color.$darkBackground.val,
		primary: getTokens().color.$primaryDark.val,
	},
	fonts: JellifyFonts,
}

export const JellifyLightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: getTokens().color.$primaryLight.val,
		border: getTokens().color.$neutral.val,
		background: getTokens().color.$white.val,
		card: getTokens().color.$white.val,
	},
	fonts: JellifyFonts,
}

export const JellifyOLEDTheme: ReactNavigation.Theme = {
	dark: true,
	colors: {
		...DarkTheme.colors,
		card: getTokens().color.$black.val,
		border: getTokens().color.$neutral.val,
		background: getTokens().color.$black.val,
		primary: getTokens().color.$primaryDark.val,
	},
	fonts: JellifyFonts,
}
