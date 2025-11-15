import type { ReactNode } from 'react'
import { Platform, StyleProp, TextStyle } from 'react-native'

const SYSTEM_FALLBACK_FONT =
	Platform.select({
		ios: 'System',
		android: 'sans-serif',
		default: 'System',
	}) ?? 'System'

// Covers Cyrillic base, supplement, extended blocks and historic variants via Unicode script metadata
const CYRILLIC_CHAR_PATTERN = /\p{Script_Extensions=Cyrillic}/u

const logFontFallbackUsage = (text: string | undefined | null, context: string) => {
	if (__DEV__) {
		const preview = text ? text.slice(0, 32) : '<empty>'
		console.debug(`[font-fallback] Using system font for ${context}: "${preview}"`)
	}
}

export const getSystemFallbackFontFamily = (): string => SYSTEM_FALLBACK_FONT

export const needsFontFallbackForText = (value?: string | null): boolean =>
	!!value && CYRILLIC_CHAR_PATTERN.test(value)

export const extractTextFromChildren = (children: ReactNode): string | undefined => {
	if (typeof children === 'string' || typeof children === 'number') {
		return `${children}`
	}

	if (Array.isArray(children)) {
		return children
			.map((child) => extractTextFromChildren(child))
			.filter((segment): segment is string => Boolean(segment))
			.join('')
	}

	return undefined
}

export const getFontFamilyWithFallback = (
	text: string | undefined | null,
	preferredFont?: string,
	context = 'font-family',
): string | undefined => {
	if (needsFontFallbackForText(text)) {
		logFontFallbackUsage(text, context)
		return SYSTEM_FALLBACK_FONT
	}

	return preferredFont
}

export const mergeFontFallbackStyle = (
	text: string | undefined,
	style?: StyleProp<TextStyle>,
	context = 'text-style',
): StyleProp<TextStyle> | undefined => {
	if (!needsFontFallbackForText(text)) {
		return style
	}

	logFontFallbackUsage(text, context)

	const fallbackStyle: TextStyle = {
		fontFamily: SYSTEM_FALLBACK_FONT,
	}

	if (!style) {
		return fallbackStyle
	}

	return Array.isArray(style) ? [...style, fallbackStyle] : [style, fallbackStyle]
}
