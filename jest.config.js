// https://docs.swmansion.com/react-native-gesture-handler/docs/guides/testing
module.exports = {
	preset: 'react-native',
	testTimeout: 10000,

	// Performance optimizations for CI
	maxWorkers: process.env.CI ? 2 : '50%',
	cacheDirectory: '.jest-cache',

	setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
	setupFilesAfterEnv: [
		'./jest/setup/setup.ts',
		'./jest/setup/async-storage.ts',
		'./jest/setup/blur.ts',
		'./jest/setup/carplay.ts',
		'./jest/setup/device-info.js', // JS to prevent Typescript implicit any warning
		'./jest/setup/google-cast.ts',
		'./jest/setup/reanimated.ts',
		'./jest/setup/rnfs.ts',
		'./jest/setup/rntp.ts',
		'./jest/setup/sentry.ts',
		'./jest/setup/nitro-fetch.ts',
		'./jest/setup/nitro-image.ts',
		'./jest/setup/nitro-ota.ts',
		'./tamagui.config.ts',
		'./jest/setup/native-modules.ts',
		'./jest/setup/worklets.ts',
	],
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	transformIgnorePatterns: [
		'node_modules/(?!(@)?(react-native|react-native-.*|react-navigation|jellyfin|burnt|expo|expo-.*|shopify)/)',
	],
	moduleNameMapper: {
		'^.+\\.ttf$': '<rootDir>/jest/setup/file-mock.ts',
	},
}
