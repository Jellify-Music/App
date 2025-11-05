// Mock for react-native-nitro-ota
jest.mock('react-native-nitro-ota', () => ({
	githubOTA: jest.fn(() => ({
		downloadUrl: 'mock://download.url',
		versionUrl: 'mock://version.url',
	})),
	OTAUpdateManager: jest.fn().mockImplementation(() => ({
		checkForUpdates: jest.fn().mockResolvedValue(null),
		downloadUpdate: jest.fn().mockResolvedValue(undefined),
	})),
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
