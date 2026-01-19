jest.mock('react-native-reanimated', () => ({
	...jest.requireActual('react-native-reanimated/mock'),
	createAnimatedPropAdapter: jest.fn,
	useReducedMotion: jest.fn,
	LayoutAnimationConfig: jest.fn,
}))

jest.mock('@jellify-music/react-native-reanimated-slider', () => ({
	__esModule: true,
	default: jest.fn(),
}))
