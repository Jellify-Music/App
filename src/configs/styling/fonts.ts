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
 * Note that this scale does NOT make `fontWeight='$6'` safe to use in components.
 * Because this app drives Tamagui animations with Reanimated, a weight token on an
 * animated component never reaches this scale — it resolves against the space scale
 * ('$6' is 32) and Reanimated then throws "Invalid font weight value: 32".
 * Always pass literal weight strings in components; see Global/helpers/text.tsx.
 *
 * This scale is kept dense and correct for the non-animated paths that do consult it.
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
