import {
	extractTextFromChildren,
	getFontFamilyWithFallback,
	getSystemFallbackFontFamily,
	needsFontFallbackForText,
} from '../font-fallback'

describe('font fallback helpers', () => {
	it('detects Cyrillic characters', () => {
		expect(needsFontFallbackForText('Привет')).toBe(true)
	})

	it('does not flag Latin text', () => {
		expect(needsFontFallbackForText('Hello World')).toBe(false)
	})

	it('extracts primitive children', () => {
		expect(extractTextFromChildren('Track')).toBe('Track')
		expect(extractTextFromChildren(42)).toBe('42')
	})

	it('flattens nested arrays of children', () => {
		expect(extractTextFromChildren(['One', ' ', 'Two'])).toBe('One Two')
	})

	it('chooses the system fallback font when needed', () => {
		const fallbackFont = getSystemFallbackFontFamily()
		expect(getFontFamilyWithFallback('Сборник', 'Figtree-Bold')).toBe(fallbackFont)
		expect(getFontFamilyWithFallback('Album', 'Figtree-Bold')).toBe('Figtree-Bold')
	})
})
