import { validateServerUrl } from '../../../src/components/Login/utils/validation'

describe('validateServerUrl', () => {
	it('returns true for a valid URL string', () => {
		expect(validateServerUrl('https://jellyfin.example.com')).toBe(true)
	})

	it('returns true for a non-empty string', () => {
		expect(validateServerUrl('some-server')).toBe(true)
	})

	it('returns false for an empty string', () => {
		expect(validateServerUrl('')).toBe(false)
	})

	it('returns false for undefined', () => {
		expect(validateServerUrl(undefined)).toBe(false)
	})

	it('returns true for whitespace-only string (lodash isEmpty considers it non-empty)', () => {
		expect(validateServerUrl('   ')).toBe(true)
	})
})
