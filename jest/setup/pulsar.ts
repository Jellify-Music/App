jest.mock('react-native-pulsar', () => {
	return {
		Presets: {
			peck: jest.fn(),
			System: {
				impactLight: jest.fn(),
				impactMedium: jest.fn(),
				impactHeavy: jest.fn(),
				impactSoft: jest.fn(),
				impactRigid: jest.fn(),
				notificationSuccess: jest.fn(),
				notificationWarning: jest.fn(),
				notificationError: jest.fn(),
				selection: jest.fn(),
				Android: {
					effectClick: jest.fn(),
					effectDoubleClick: jest.fn(),
					effectTick: jest.fn(),
					effectHeavyClick: jest.fn(),
				},
			},
		},
		Settings: {
			enableHaptics: jest.fn(),
			enableSound: jest.fn(),
			enableCache: jest.fn(),
			clearCache: jest.fn(),
			preloadPresets: jest.fn(),
			stopHaptics: jest.fn(),
			shutDownEngine: jest.fn(),
			getHapticsSupportLevel: jest.fn(),
			forceHapticsSupportLevel: jest.fn(),
			enableImpulseCompositionMode: jest.fn(),
			setRealtimeComposerStrategy: jest.fn(),
		},
		useRealtimeComposer: jest.fn(() => ({
			set: jest.fn(),
			playDiscrete: jest.fn(),
			stop: jest.fn(),
			isActive: jest.fn(() => false),
		})),
		usePatternComposer: jest.fn(() => ({
			play: jest.fn(),
			stop: jest.fn(),
			parse: jest.fn(),
			isParsed: jest.fn(() => false),
		})),
		useAdaptiveHaptics: jest.fn(() => ({
			play: jest.fn(),
		})),
		HapticSupport: {
			NO_SUPPORT: 0,
			MINIMAL_SUPPORT: 1,
			LIMITED_SUPPORT: 2,
			STANDARD_SUPPORT: 3,
			ADVANCED_SUPPORT: 4,
		},
		RealtimeComposerStrategy: {
			ENVELOPE: 0,
			PRIMITIVE_TICK: 1,
			PRIMITIVE_COMPLEX: 2,
			ENVELOPE_WITH_DISCRETE_PRIMITIVES: 3,
		},
	}
})
