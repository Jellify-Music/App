jest.mock('react-native-pulsar', () => {
	return {
		Presets: {
			impactLight: 'impactLight',
			impactMedium: 'impactMedium',
			impactHeavy: 'impactHeavy',
			notificationSuccess: 'notificationSuccess',
			notificationWarning: 'notificationWarning',
			notificationError: 'notificationError',
			selection: 'selection',
		},
	}
})
