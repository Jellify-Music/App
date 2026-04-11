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

import usePlayerEngineStore, { PlayerEngine } from '../../../src/stores/player/engine'

const initialState = usePlayerEngineStore.getState()

beforeEach(() => {
	usePlayerEngineStore.setState(initialState, true)
})

describe('player engine store', () => {
	describe('defaults', () => {
		it('has playerEngineData set to REACT_NATIVE_TRACK_PLAYER', () => {
			const state = usePlayerEngineStore.getState()
			expect(state.playerEngineData).toBe(PlayerEngine.REACT_NATIVE_TRACK_PLAYER)
		})
	})

	describe('setPlayerEngineData', () => {
		it('updates playerEngineData to GOOGLE_CAST', () => {
			usePlayerEngineStore.getState().setPlayerEngineData(PlayerEngine.GOOGLE_CAST)
			expect(usePlayerEngineStore.getState().playerEngineData).toBe(PlayerEngine.GOOGLE_CAST)
		})

		it('updates playerEngineData to CARPLAY', () => {
			usePlayerEngineStore.getState().setPlayerEngineData(PlayerEngine.CARPLAY)
			expect(usePlayerEngineStore.getState().playerEngineData).toBe(PlayerEngine.CARPLAY)
		})
	})
})
