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

import { useDeveloperSettingsStore } from '../../../src/stores/settings/developer'

const initialState = useDeveloperSettingsStore.getState()

beforeEach(() => {
	useDeveloperSettingsStore.setState(initialState, true)
})

describe('developer settings store', () => {
	describe('defaults', () => {
		it('has developerOptionsEnabled set to false', () => {
			const state = useDeveloperSettingsStore.getState()
			expect(state.developerOptionsEnabled).toBe(false)
		})

		it('has prId set to empty string', () => {
			const state = useDeveloperSettingsStore.getState()
			expect(state.prId).toBe('')
		})
	})

	describe('setDeveloperOptionsEnabled', () => {
		it('updates developerOptionsEnabled to true', () => {
			useDeveloperSettingsStore.getState().setDeveloperOptionsEnabled(true)
			expect(useDeveloperSettingsStore.getState().developerOptionsEnabled).toBe(true)
		})
	})

	describe('setPrId', () => {
		it('updates prId to the given value', () => {
			useDeveloperSettingsStore.getState().setPrId('123')
			expect(useDeveloperSettingsStore.getState().prId).toBe('123')
		})
	})
})
