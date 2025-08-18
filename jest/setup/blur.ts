jest.mock('react-native-blurhash', () => {
	return {
		Blurhash: jest.fn(),
	}
})
