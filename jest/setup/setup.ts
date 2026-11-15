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

jest.mock('react-native-superconfig', () => ({
	__esModule: true,
	default: {
		OTA_UPDATE_ENABLED: 'false',
		IS_MAESTRO_BUILD: 'false',
		GLITCHTIP_DSN: '',
		TELEMETRYDECK_APPID: '00000000-0000-0000-0000-000000000000',
	},
}))

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')

// Mock the network watcher to avoid opening a native websocket
jest.mock('../../src/components/Network/internetConnectionWatcher', () => ({
	__esModule: true,
	default: () => null,
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
