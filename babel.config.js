module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		'babel-plugin-react-compiler',
		'react-native-worklets/plugin',
		'react-native-worklets-core/plugin',
	],
}
