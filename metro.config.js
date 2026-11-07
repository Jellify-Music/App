// Learn more https://docs.expo.io/guides/customizing-metro
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config')

const { withSentryConfig } = require('@sentry/react-native/metro')

const { getDefaultConfig } = require('@react-native/metro-config')

const config = getDefaultConfig(__dirname, {
	// [Web-only]: Enables CSS support in Metro.
	isCSSEnabled: true,
})

// Expo 49 issue: default metro config needs to include "mjs"
// https://github.com/expo/expo/issues/23180
config.resolver.sourceExts.push('mjs')

// Import .svg files as react-native-svg components
config.transformer.babelTransformerPath =
	require.resolve('react-native-svg-transformer/react-native')
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg')
config.resolver.sourceExts.push('svg')

config.watchFolders = ['src']

module.exports = withSentryConfig(wrapWithReanimatedMetroConfig(config))
