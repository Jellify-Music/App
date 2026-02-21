jest.mock('react-native-nitro-player', () => ({
	TrackPlayer: jest.fn().mockImplementation(() => ({
		play: jest.fn(),
		pause: jest.fn(),
		stop: jest.fn(),
		configure: jest.fn(),
		onChangeTrack: jest.fn(),
		skipToNext: jest.fn(),
		skipToPrevious: jest.fn(),
	})),
}))
