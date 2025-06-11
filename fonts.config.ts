import { fonts } from '@tamagui/config/v4'
import { createFont } from 'tamagui'

const figtreeFace = {
	100: { normal: 'Figtree-Light', italic: 'Figtree Light Italic' },
	200: { normal: 'Figtree-Light', italic: 'Figtree Light Italic' },
	300: { normal: 'Figtree-Light', italic: 'Figtree Light Italic' },
	400: { normal: 'Figtree-Regular', italic: 'Figtree Italic' },
	500: { normal: 'Figtree-Medium', italic: 'Figtree Medium Italic' },
	600: { normal: 'Figtree-SemiBold', italic: 'Figtree SemiBold Italic' },
	700: { normal: 'Figtree-Bold', italic: 'Figtree Bold Italic' },
	800: { normal: 'Figtree-Heavy', italic: 'Figtree Heavy Italic' },
	900: { normal: 'Figtree-Black', italic: 'Figtree-BlackItalic' },
}

export const bodyFont = createFont({
	family: 'Figtree-SemiBold',
	size: fonts.body.size,
	lineHeight: fonts.body.lineHeight,
	weight: fonts.body.weight,
	letterSpacing: fonts.body.letterSpacing,
	face: figtreeFace,
})

export const headingFont = createFont({
	family: 'Figtree-Black',
	size: fonts.heading.size,
	lineHeight: fonts.heading.lineHeight,
	weight: fonts.heading.weight,
	letterSpacing: fonts.heading.letterSpacing,
	face: figtreeFace,
})
