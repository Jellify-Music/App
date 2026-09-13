// Mock for react-native-nitro-ota
jest.mock('react-native-nitro-ota', () => ({
	githubOTA: jest.fn(() => ({
		downloadUrl: 'mock://download.url',
		versionUrl: 'mock://version.url',
	})),
	OTAUpdateManager: jest.fn().mockImplementation(() => ({
		checkForUpdates: jest.fn().mockResolvedValue(null),
		hasCompatibleUpdate: jest.fn().mockResolvedValue(false),
		downloadUpdate: jest.fn().mockResolvedValue(undefined),
		lastDownload: null,
	})),
	reloadApp: jest.fn(),
	isPatchSupported: jest.fn(() => false),
	getStoredOtaVersion: jest.fn(() => null),
}))

// Update the existing nitro-modules mock to include createHybridObject
jest.mock('react-native-nitro-modules', () => ({
	NitroModules: {
		createModule: jest.fn(),
		install: jest.fn(),
		createHybridObject: jest.fn(() => ({})),
	},
	createNitroModule: jest.fn(),
}))
