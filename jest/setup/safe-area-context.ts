/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals'

jest.mock('react-native-safe-area-context', () => {
	const React = require('react')
	const insets = { top: 0, left: 0, right: 0, bottom: 0 }
	const frame = { x: 0, y: 0, width: 390, height: 844 }
	const initialWindowMetrics = { insets, frame }

	const SafeAreaContext = React.createContext(insets)
	const SafeAreaFrameContext = React.createContext(frame)
	const SafeAreaInsetsContext = React.createContext(insets)

	return {
		SafeAreaContext,
		SafeAreaFrameContext,
		SafeAreaInsetsContext,
		SafeAreaProvider: ({ children }: any) => {
			return React.createElement(
				SafeAreaContext.Provider,
				{ value: insets },
				React.createElement(SafeAreaFrameContext.Provider, { value: frame }, children),
			)
		},
		SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
		SafeAreaConsumer: ({ children }: any) => children(insets),
		useSafeAreaInsets: () => insets,
		useSafeAreaFrame: () => frame,
		initialWindowMetrics,
	}
})
