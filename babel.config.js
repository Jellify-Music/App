module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		[
			'@tamagui/babel-plugin',
			{
				components: ['tamagui'],
				config: './src/configs/tamagui.config.ts',
			},
		],
		'babel-plugin-react-compiler',
		'react-native-worklets/plugin',
	],
}
