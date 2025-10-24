import mockRefreshControl from './refresh-control'

jest.mock('../../src/api/info', () => {
	return {
		JellyfinInfo: {
			clientInfo: {
				name: 'Jellify',
				version: '0.0.1',
			},
			deviceInfo: {
				name: 'iPhone 12',
				id: '1234567890',
			},
			createApi: jest.fn(),
		},
	}
})

jest.mock('react-native-ota-hot-update', () => {
	return {
		git: {
			checkForGitUpdate: jest.fn(),
		},
		resetApp: jest.fn(),
	}
})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

jest.mock('react-native-haptic-feedback', () => {
	return {
		trigger: jest.fn(),
	}
})

// Mock the network status types to avoid dependency issues
jest.mock('../../src/components/Network/internetConnectionWatcher', () => ({
	networkStatusTypes: {
		ONLINE: 'ONLINE',
		OFFLINE: 'OFFLINE',
	},
}))

jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({
	__esModule: true,
	default: mockRefreshControl,
}))

jest.mock('react-native-toast-message', () => {
	return {
		show: jest.fn(),
		hide: jest.fn(),
	}
})
