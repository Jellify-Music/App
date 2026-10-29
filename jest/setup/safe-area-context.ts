// Without this, SafeAreaProvider never resolves its onLayout measurement in
// the test environment, so children never mount (RNTL only sees an empty
// <RNCSafeAreaProvider />).
jest.mock(
	'react-native-safe-area-context',
	() => require('react-native-safe-area-context/jest/mock').default,
)
