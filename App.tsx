import './gesture-handler'
import React, { useEffect, useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider } from 'tamagui'
import { LogBox, Platform, useColorScheme } from 'react-native'
import jellifyConfig from './tamagui.config'
import { queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { getJellifyNavTheme } from './src/components/theme'
import ErrorBoundary from './src/components/ErrorBoundary'
import OTAUpdateScreen from './src/components/OtaUpdates'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import navigationRef from './navigation'
import { useColorPresetSetting, useThemeSetting } from './src/stores/settings/app'
import { getApi } from './src/stores'
import CarPlayNavigation from './src/components/CarPlay/Navigation'
import { CarPlay } from 'react-native-carplay'
import { useAutoStore } from './src/stores/auto'
import { registerAutoService } from './src/services/carplay'
import QueryPersistenceConfig from './src/configs/query-persistence.config'
import registerTrackPlayer from './src/services/player'
import configureDownloadManager from './src/services/downloads'
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated'

LogBox.ignoreAllLogs()

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	usePerformanceMonitor('App', 3)

	const { setIsConnected } = useAutoStore()

	const onConnect = () => {
		const api = getApi()

		if (api) {
			CarPlay.setRootTemplate(CarPlayNavigation)

			if (Platform.OS === 'ios') {
				CarPlay.enableNowPlaying(true)
			}
		}
		setIsConnected(true)
	}

	const onDisconnect = () => setIsConnected(false)

	useEffect(() => {
		registerTrackPlayer()
		configureDownloadManager()
		return registerAutoService(onConnect, onDisconnect)
	}, []) // Empty deps - only run once on mount

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
	const [theme] = useThemeSetting()
	const [colorPreset] = useColorPresetSetting()

	const isDarkMode = useColorScheme() === 'dark'
	const resolvedMode = theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme

	return (
		<NavigationContainer
			ref={navigationRef}
			theme={getJellifyNavTheme(colorPreset, resolvedMode)}
		>
			<GestureHandlerRootView>
				<ReducedMotionConfig mode={ReduceMotion.System} />
				<TamaguiProvider config={jellifyConfig}>
					<Jellify />
				</TamaguiProvider>
			</GestureHandlerRootView>
		</NavigationContainer>
	)
}
