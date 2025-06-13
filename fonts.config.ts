import { fonts } from '@tamagui/config/v4'
import { createFont } from 'tamagui'

const figtreeFace = {
	100: { normal: 'Figtree-Light', italic: 'Figtree Light Italic' },
	200: { normal: 'Figtree-Light', italic: 'Figtree Light Italic' },
	300: { normal: 'Figtree-Regular', italic: 'Figtree Italic' },
	400: { normal: 'Figtree-Medium', italic: 'Figtree Medium Italic' },
	500: { normal: 'Figtree-SemiBold', italic: 'Figtree SemiBold Italic' },
	600: { normal: 'Figtree-Bold', italic: 'Figtree Bold Italic' },
	700: { normal: 'Figtree-ExtraBold', italic: 'Figtree ExtraBold Italic' },
	800: { normal: 'Figtree-Black', italic: 'Figtree Black Italic' },
	900: { normal: 'Figtree-Black', italic: 'Figtree Black Italic' },
}

export const bodyFont = createFont({
	family: 'Figtree',
	size: fonts.body.size,
	lineHeight: fonts.body.lineHeight,
	weight: {
		4: '300',
		6: '600',
		8: '900',
	},
	letterSpacing: fonts.body.letterSpacing,
	face: figtreeFace,
})

export const headingFont = createFont({
	family: 'Figtree',
	size: fonts.heading.size,
	lineHeight: fonts.heading.lineHeight,
	weight: {
		4: '300',
		6: '600',
		8: '900',
	},
	letterSpacing: fonts.heading.letterSpacing,
	face: figtreeFace,
})
