import './gesture-handler'
import React, { useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider } from 'tamagui'
import { LogBox } from 'react-native'
import jellifyConfig from './src/configs/tamagui.config'
import { queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import ErrorBoundary from './src/components/ErrorBoundary'
import OTAUpdateScreen from './src/components/OtaUpdates'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import QueryPersistenceConfig from './src/configs/query-persistence.config'
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated'

LogBox.ignoreAllLogs()

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	usePerformanceMonitor('App', 3)

	const [reloader, setReloader] = useState(0)

	const handleRetry = () => setReloader((r) => r + 1)

	return (
		<React.StrictMode>
			<SafeAreaProvider>
				<OTAUpdateScreen />
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
		<GestureHandlerRootView>
			<ReducedMotionConfig mode={ReduceMotion.System} />
			<TamaguiProvider config={jellifyConfig} defaultTheme={'purple_dark'}>
				<Jellify />
			</TamaguiProvider>
		</GestureHandlerRootView>
	)
}
