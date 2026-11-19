jest.mock('react-native-keyboard-controller', () => ({
	...require('react-native-keyboard-controller/jest'),
	// Not provided by the package's own jest mock
	useAnimatedKeyboard: jest.fn().mockReturnValue({
		height: { value: 0, get: jest.fn().mockReturnValue(0), set: jest.fn() },
		state: { value: 0, get: jest.fn().mockReturnValue(0), set: jest.fn() },
	}),
}))
