import './gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
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
import { JellifyDarkTheme, JellifyLightTheme, JellifyOLEDTheme } from './src/components/theme'
import { requestStoragePermission } from './src/utils/permisson-helpers'
import ErrorBoundary from './src/components/ErrorBoundary'
import OTAUpdateScreen from './src/components/OtaUpdates'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import navigationRef from './navigation'
import { useThemeSetting } from './src/stores/settings/app'
import { getApi } from './src/stores'
import CarPlayNavigation from './src/components/CarPlay/Navigation'
import { CarPlay } from 'react-native-carplay'
import { useAutoStore } from './src/stores/auto'
import { registerAutoService } from './src/player'
import QueryPersistenceConfig from './src/configs/query-persistence.config'

LogBox.ignoreAllLogs()

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	usePerformanceMonitor('App', 3)

	const [playerIsReady, setPlayerIsReady] = useState<boolean>(true)

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
						<Container playerIsReady={playerIsReady} />
					</PersistQueryClientProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</React.StrictMode>
	)
}

function Container({ playerIsReady }: { playerIsReady: boolean }): React.JSX.Element {
	const [theme] = useThemeSetting()

	const isDarkMode = useColorScheme() === 'dark'

	return (
		<NavigationContainer
			ref={navigationRef}
			theme={
				theme === 'system'
					? isDarkMode
						? JellifyDarkTheme
						: JellifyLightTheme
					: theme === 'dark'
						? JellifyDarkTheme
						: theme === 'oled'
							? JellifyOLEDTheme
							: JellifyLightTheme
			}
		>
			<GestureHandlerRootView>
				<TamaguiProvider config={jellifyConfig}>
					{playerIsReady && <Jellify />}
				</TamaguiProvider>
			</GestureHandlerRootView>
		</NavigationContainer>
	)
}
