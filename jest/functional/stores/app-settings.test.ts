jest.mock('../../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

import { useAppSettingsStore } from '../../../src/stores/settings/app'

const initialState = useAppSettingsStore.getState()

beforeEach(() => {
	useAppSettingsStore.setState(initialState, true)
})

describe('app settings store', () => {
	describe('defaults', () => {
		it('has system as default theme', () => {
			expect(useAppSettingsStore.getState().theme).toBe('system')
		})

		it('has purple as default colorPreset', () => {
			expect(useAppSettingsStore.getState().colorPreset).toBe('purple')
		})

		it('has reducedHaptics disabled by default', () => {
			expect(useAppSettingsStore.getState().reducedHaptics).toBe(false)
		})

		it('has sendMetrics disabled by default', () => {
			expect(useAppSettingsStore.getState().sendMetrics).toBe(false)
		})

		it('has hideRunTimes disabled by default', () => {
			expect(useAppSettingsStore.getState().hideRunTimes).toBe(false)
		})
	})

	describe('setTheme', () => {
		it('updates the theme', () => {
			useAppSettingsStore.getState().setTheme('dark')
			expect(useAppSettingsStore.getState().theme).toBe('dark')
		})
	})

	describe('setColorPreset', () => {
		it('updates the colorPreset', () => {
			useAppSettingsStore.getState().setColorPreset('ocean')
			expect(useAppSettingsStore.getState().colorPreset).toBe('ocean')
		})
	})
})
