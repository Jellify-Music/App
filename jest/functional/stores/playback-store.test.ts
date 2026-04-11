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

import { usePlayerPlaybackStore, setPlaybackPosition } from '../../../src/stores/player/playback'

const initialState = usePlayerPlaybackStore.getState()

beforeEach(() => {
	usePlayerPlaybackStore.setState(initialState, true)
})

describe('player playback store', () => {
	describe('defaults', () => {
		it('has position set to 0', () => {
			const state = usePlayerPlaybackStore.getState()
			expect(state.position).toBe(0)
		})
	})

	describe('setPosition', () => {
		it('updates position to the given value', () => {
			usePlayerPlaybackStore.getState().setPosition(42.5)
			expect(usePlayerPlaybackStore.getState().position).toBe(42.5)
		})

		it('resets position to 0', () => {
			usePlayerPlaybackStore.getState().setPosition(100)
			usePlayerPlaybackStore.getState().setPosition(0)
			expect(usePlayerPlaybackStore.getState().position).toBe(0)
		})
	})

	describe('setPlaybackPosition', () => {
		it('updates the store position via the external function', () => {
			setPlaybackPosition(99.9)
			expect(usePlayerPlaybackStore.getState().position).toBe(99.9)
		})
	})
})
