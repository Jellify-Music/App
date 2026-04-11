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

jest.mock('../../../src/components/Network/internetConnectionWatcher', () => ({
	networkStatusTypes: {
		ONLINE: 'ONLINE',
		DISCONNECTED: 'DISCONNECTED',
	},
}))

import { networkStatusTypes } from '../../../src/components/Network/internetConnectionWatcher'
import { useNetworkStore } from '../../../src/stores/network/index'

const initialState = useNetworkStore.getState()

beforeEach(() => {
	useNetworkStore.setState(initialState, true)
})

describe('network store', () => {
	describe('defaults', () => {
		it('has networkStatus set to null', () => {
			const state = useNetworkStore.getState()
			expect(state.networkStatus).toBeNull()
		})
	})

	describe('setNetworkStatus', () => {
		it('updates networkStatus to ONLINE', () => {
			useNetworkStore.getState().setNetworkStatus(networkStatusTypes.ONLINE)
			expect(useNetworkStore.getState().networkStatus).toBe(networkStatusTypes.ONLINE)
		})

		it('updates networkStatus to DISCONNECTED', () => {
			useNetworkStore.getState().setNetworkStatus(networkStatusTypes.DISCONNECTED)
			expect(useNetworkStore.getState().networkStatus).toBe(networkStatusTypes.DISCONNECTED)
		})

		it('resets networkStatus to null', () => {
			useNetworkStore.getState().setNetworkStatus(networkStatusTypes.ONLINE)
			useNetworkStore.getState().setNetworkStatus(null)
			expect(useNetworkStore.getState().networkStatus).toBeNull()
		})
	})
})
