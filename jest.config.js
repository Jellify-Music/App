// https://docs.swmansion.com/react-native-gesture-handler/docs/guides/testing
module.exports = {
	preset: '@react-native/jest-preset',
	resolver: '<rootDir>/jest/resolvers/reanimated.js',
	testTimeout: 10000,

	// Performance optimizations for CI
	maxWorkers: process.env.CI ? 2 : '50%',
	cacheDirectory: '.jest-cache',

	setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
	setupFilesAfterEnv: [
		'./jest/setup/setup.ts',
		'./jest/setup/blur.ts',
		'./jest/setup/carplay.ts',
		'./jest/setup/clipboard.ts',
		'./jest/setup/device-info.js', // JS to prevent Typescript implicit any warning
		'./jest/setup/worklets.ts', // Must be before Reanimated
		'./jest/setup/reanimated.ts',
		'./jest/setup/sentry.ts',
		'./jest/setup/nitro-fetch.ts',
		'./jest/setup/nitro-image.ts',
		'./jest/setup/nitro-ota.ts',
		'./jest/setup/nitro-player.ts',
		'./jest/setup/pulsar.ts',
		'./jest/setup/rnfs.ts',
		'./jest/setup/keyboard-controller.ts',
		'./jest/setup/safe-area-context.ts',
		'./src/configs/tamagui.config.ts',
		'./jest/setup/native-modules.ts',
	],
	extensionsToTreatAsEsm: ['.ts', '.tsx'],
	transformIgnorePatterns: [
		'node_modules/(?!(@)?(react-native|react-native-.*|react-navigation|jellyfin|burnt|expo|expo-.*|shopify|tamagui|moti|@tamagui|@motify)/)',
	],
	transform: {
		// Tamagui packages ship .mjs files that must be transpiled to CommonJS
		'^.+\\.(js|mjs|ts|tsx)$': 'babel-jest',
	},
	moduleNameMapper: {
		'^.+\\.ttf$': '<rootDir>/jest/setup/file-mock.ts',
	},
}
