jest.mock('@react-native-clipboard/clipboard', () => {
	return {
		setString: jest.fn(),
	}
})
