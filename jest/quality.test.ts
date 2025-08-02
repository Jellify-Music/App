import { shouldUseDownloadedFile, isValidQuality, getSafeQuality } from '../src/utils/quality'

describe('Quality Utilities', () => {
	describe('shouldUseDownloadedFile', () => {
		it('should prefer higher quality downloaded files', () => {
			expect(shouldUseDownloadedFile('high', 'medium')).toBe(true)
			expect(shouldUseDownloadedFile('original', 'high')).toBe(true)
		})

		it('should use streaming for higher quality requests', () => {
			expect(shouldUseDownloadedFile('medium', 'high')).toBe(false)
			expect(shouldUseDownloadedFile('low', 'original')).toBe(false)
		})

		it('should use downloaded file for equal quality', () => {
			expect(shouldUseDownloadedFile('high', 'high')).toBe(true)
			expect(shouldUseDownloadedFile('medium', 'medium')).toBe(true)
		})

		it('should handle undefined downloaded quality gracefully', () => {
			expect(shouldUseDownloadedFile(undefined, 'high')).toBe(false)
			expect(shouldUseDownloadedFile(undefined, 'medium')).toBe(true)
			expect(shouldUseDownloadedFile(undefined, 'low')).toBe(true)
		})

		it('should handle invalid quality strings', () => {
			// Should log warning and default to using downloaded file
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(shouldUseDownloadedFile('invalid' as any, 'high')).toBe(true)
		})
	})

	describe('isValidQuality', () => {
		it('should validate correct quality strings', () => {
			expect(isValidQuality('low')).toBe(true)
			expect(isValidQuality('medium')).toBe(true)
			expect(isValidQuality('high')).toBe(true)
			expect(isValidQuality('original')).toBe(true)
		})

		it('should reject invalid quality strings', () => {
			expect(isValidQuality('invalid')).toBe(false)
			expect(isValidQuality('')).toBe(false)
			expect(isValidQuality('HIGH')).toBe(false) // case sensitive
		})
	})

	describe('getSafeQuality', () => {
		it('should return valid quality as-is', () => {
			expect(getSafeQuality('high')).toBe('high')
			expect(getSafeQuality('low')).toBe('low')
		})

		it('should return fallback for invalid quality', () => {
			expect(getSafeQuality('invalid')).toBe('medium')
			expect(getSafeQuality('invalid', 'high')).toBe('high')
		})

		it('should return fallback for undefined quality', () => {
			expect(getSafeQuality(undefined)).toBe('medium')
			expect(getSafeQuality(undefined, 'low')).toBe('low')
		})
	})
})
