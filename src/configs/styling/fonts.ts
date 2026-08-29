import { fonts } from '@tamagui/config/v4'
import { createFont } from 'tamagui'

/**
 * Maps a CSS numeric font weight to the Figtree file that actually implements it.
 *
 * Every name here must match a file in assets/fonts/ exactly (minus the extension) —
 * Android resolves fontFamily by asset filename, so a name that does not match falls
 * back to the system font, and on Fabric can fail outright rather than degrade.
 *
 * Figtree ships no Thin or ExtraLight cut, so 100/200 reuse Light.
 */
const figtreeFace = {
	100: { normal: 'Figtree-Light', italic: 'Figtree-LightItalic' },
	200: { normal: 'Figtree-Light', italic: 'Figtree-LightItalic' },
	300: { normal: 'Figtree-Light', italic: 'Figtree-LightItalic' },
	400: { normal: 'Figtree-Regular', italic: 'Figtree-Italic' },
	500: { normal: 'Figtree-Medium', italic: 'Figtree-MediumItalic' },
	600: { normal: 'Figtree-SemiBold', italic: 'Figtree-SemiBoldItalic' },
	700: { normal: 'Figtree-Bold', italic: 'Figtree-BoldItalic' },
	800: { normal: 'Figtree-ExtraBold', italic: 'Figtree-ExtraBoldItalic' },
	900: { normal: 'Figtree-Black', italic: 'Figtree-BlackItalic' },
}

/**
 * Weight tokens ($1-$10) mapped to CSS numeric weights.
 *
 * This scale must be dense. A gap means `fontWeight='$8'` finds nothing in the weight
 * scale and resolves against a different token scale instead, yielding a nonsense
 * value like `fontWeight: 32` that Android rejects.
 */
const figtreeWeight = {
	1: '300',
	2: '300',
	3: '300',
	4: '400',
	5: '500',
	6: '600',
	7: '700',
	8: '800',
	9: '900',
	10: '900',
}

export const bodyFont = createFont({
	family: 'Figtree',
	size: fonts.body.size,
	lineHeight: fonts.body.lineHeight,
	weight: figtreeWeight,
	letterSpacing: fonts.body.letterSpacing,
	face: figtreeFace,
})

export const headingFont = createFont({
	family: 'Figtree',
	size: fonts.heading.size,
	lineHeight: fonts.heading.lineHeight,
	weight: figtreeWeight,
	letterSpacing: fonts.heading.letterSpacing,
	face: figtreeFace,
})
