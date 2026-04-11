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

import { useSwipeSettingsStore } from '../../../src/stores/settings/swipe'

const initialState = useSwipeSettingsStore.getState()

beforeEach(() => {
	useSwipeSettingsStore.setState(initialState, true)
})

describe('swipe settings store', () => {
	describe('defaults', () => {
		it('has correct default left actions', () => {
			const state = useSwipeSettingsStore.getState()
			expect(state.left).toEqual(['ToggleFavorite', 'AddToPlaylist'])
		})

		it('has correct default right actions', () => {
			const state = useSwipeSettingsStore.getState()
			expect(state.right).toEqual(['AddToQueue'])
		})
	})

	describe('toggleLeft', () => {
		it('adds an action when not present', () => {
			useSwipeSettingsStore.getState().toggleLeft('AddToQueue')
			expect(useSwipeSettingsStore.getState().left).toEqual([
				'ToggleFavorite',
				'AddToPlaylist',
				'AddToQueue',
			])
		})

		it('removes an action when already present', () => {
			useSwipeSettingsStore.getState().toggleLeft('ToggleFavorite')
			expect(useSwipeSettingsStore.getState().left).toEqual(['AddToPlaylist'])
		})
	})

	describe('toggleRight', () => {
		it('adds an action when not present', () => {
			useSwipeSettingsStore.getState().toggleRight('ToggleFavorite')
			expect(useSwipeSettingsStore.getState().right).toEqual(['AddToQueue', 'ToggleFavorite'])
		})

		it('removes an action when already present', () => {
			useSwipeSettingsStore.getState().toggleRight('AddToQueue')
			expect(useSwipeSettingsStore.getState().right).toEqual([])
		})
	})

	describe('setLeft', () => {
		it('replaces the entire left array', () => {
			useSwipeSettingsStore.getState().setLeft(['AddToQueue'])
			expect(useSwipeSettingsStore.getState().left).toEqual(['AddToQueue'])
		})
	})

	describe('setRight', () => {
		it('replaces the entire right array', () => {
			useSwipeSettingsStore.getState().setRight(['ToggleFavorite', 'AddToPlaylist'])
			expect(useSwipeSettingsStore.getState().right).toEqual([
				'ToggleFavorite',
				'AddToPlaylist',
			])
		})
	})
})
