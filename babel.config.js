module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		// react-native-worklets/plugin has to be listed last
		'react-native-worklets/plugin',
	],
}
