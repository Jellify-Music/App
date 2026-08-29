import './gesture-handler'
import React, { useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider } from 'tamagui'
import { LogBox, StyleSheet } from 'react-native'
import jellifyConfig from './src/configs/styling/tamagui'
import { queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import ErrorBoundary from './src/components/ErrorBoundary'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import QueryPersistenceConfig from './src/configs/query-persistence.config'
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated'
import { useOtaUpdate } from './src/hooks/ota'

// NOTE: this hides the LogBox overlay but does NOT make logging free. Console calls
// still run through LogBoxData.addLog and are forwarded to Metro, so noisy components
// remain expensive in debug builds even though nothing appears on screen. Suppressing
// the overlay also means real errors are easy to miss — check the Metro terminal.
LogBox.ignoreAllLogs()

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	usePerformanceMonitor('App', 3)

	useOtaUpdate()

	const [reloader, setReloader] = useState(0)

	const handleRetry = () => setReloader((r) => r + 1)

	return (
		/*
		 * NOTE: StrictMode deliberately double-invokes renders and effects in dev only
		 * (it is inert in release). That is useful for surfacing impure renders, but it
		 * also doubles the work behind every interaction in debug builds and can create
		 * transient view states that native code does not expect — it was a suspected
		 * amplifier of the react-native-gesture-handler "more than one child view"
		 * assertion. If a dev-only crash resists explanation, try removing this wrapper
		 * as a diagnostic; it changes nothing about release behaviour.
		 */
		<React.StrictMode>
			<SafeAreaProvider>
				<ErrorBoundary reloader={reloader} onRetry={handleRetry}>
					<PersistQueryClientProvider
						client={queryClient}
						persistOptions={QueryPersistenceConfig}
					>
						<Container />
					</PersistQueryClientProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</React.StrictMode>
	)
}

function Container(): React.JSX.Element {
	return (
		<GestureHandlerRootView style={styles.gestureHandlerRootView}>
			<TamaguiProvider config={jellifyConfig} defaultTheme={'purple_dark'}>
				<Jellify />
			</TamaguiProvider>
		</GestureHandlerRootView>
	)
}

const styles = StyleSheet.create({
	gestureHandlerRootView: {
		flex: 1,
	},
})
