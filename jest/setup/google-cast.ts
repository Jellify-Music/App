jest.mock('react-native-google-cast', () => ({
	__esModule: true,

	// Commonly accessed API
	getCurrentCastSession: jest.fn(() => null),

	// Hooks (very important)
	useCastSession: jest.fn(() => null),
	useRemoteMediaClient: jest.fn(() => null),

	// Constants sometimes referenced
	CastState: {
		NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE',
		NOT_CONNECTED: 'NOT_CONNECTED',
		CONNECTING: 'CONNECTING',
		CONNECTED: 'CONNECTED',
	},
}))
