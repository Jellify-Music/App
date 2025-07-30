jest.mock('react-native-reanimated', () => ({
	...jest.requireActual('react-native-reanimated/mock'),
	createAnimatedPropAdapter: jest.fn,
	useReducedMotion: jest.fn,
	LayoutAnimationConfig: jest.fn,
}))
