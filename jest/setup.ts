jest.mock('../src/api/info', () => {
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
		default: {
			trigger: jest.fn(),
		},
	}
})

jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({
	__esModule: true,
	default: require('./setup-refresh-control'),
}))
