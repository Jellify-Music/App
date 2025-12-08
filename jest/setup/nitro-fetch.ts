// Mock for react-native-nitro-fetch
jest.mock('react-native-nitro-fetch', () => ({
	nitroFetchOnWorklet: jest.fn(() => Promise.resolve({})),
	nitroFetch: jest.fn(() => Promise.resolve({})),
}))

// Update the nitro-modules mock to include the box method
jest.mock('react-native-nitro-modules', () => {
	const actual = jest.requireActual('react-native-nitro-modules')
	return {
		...actual,
		NitroModules: {
			...actual?.NitroModules,
			createModule: jest.fn(),
			install: jest.fn(),
			createHybridObject: jest.fn(() => ({})),
			box: jest.fn((value) => value), // Mock the box method
		},
		createNitroModule: jest.fn(),
	}
})
