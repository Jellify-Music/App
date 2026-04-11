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

import { useAutoStore } from '../../../src/stores/auto/index'

const initialState = useAutoStore.getState()

beforeEach(() => {
	useAutoStore.setState(initialState, true)
})

describe('auto store', () => {
	describe('defaults', () => {
		it('has isConnected set to false', () => {
			const state = useAutoStore.getState()
			expect(state.isConnected).toBe(false)
		})
	})

	describe('setIsConnected', () => {
		it('updates isConnected to true', () => {
			useAutoStore.getState().setIsConnected(true)
			expect(useAutoStore.getState().isConnected).toBe(true)
		})

		it('resets isConnected to false', () => {
			useAutoStore.getState().setIsConnected(true)
			useAutoStore.getState().setIsConnected(false)
			expect(useAutoStore.getState().isConnected).toBe(false)
		})
	})
})
