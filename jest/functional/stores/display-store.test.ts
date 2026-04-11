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

import usePlayerDisplayStore from '../../../src/stores/player/display'

const initialState = usePlayerDisplayStore.getState()

beforeEach(() => {
	usePlayerDisplayStore.setState(initialState, true)
})

describe('player display store', () => {
	describe('defaults', () => {
		it('has isPlayerFocused set to false', () => {
			const state = usePlayerDisplayStore.getState()
			expect(state.isPlayerFocused).toBe(false)
		})
	})

	describe('setIsPlayerFocused', () => {
		it('updates isPlayerFocused to true', () => {
			usePlayerDisplayStore.getState().setIsPlayerFocused(true)
			expect(usePlayerDisplayStore.getState().isPlayerFocused).toBe(true)
		})

		it('resets isPlayerFocused to false', () => {
			usePlayerDisplayStore.getState().setIsPlayerFocused(true)
			usePlayerDisplayStore.getState().setIsPlayerFocused(false)
			expect(usePlayerDisplayStore.getState().isPlayerFocused).toBe(false)
		})
	})
})
