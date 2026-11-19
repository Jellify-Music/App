jest.mock('@sentry/react-native', () => ({
	init: jest.fn(),
	close: jest.fn(() => Promise.resolve()),
	wrap: jest.fn((component) => component),
	captureException: jest.fn(),
	captureMessage: jest.fn(),
	consoleLoggingIntegration: jest.fn(() => ({ name: 'ConsoleLogs' })),
	reactNavigationIntegration: jest.fn(() => ({
		name: 'ReactNavigation',
		registerNavigationContainer: jest.fn(),
	})),
}))
