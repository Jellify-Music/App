import './gesture-handler'
import React, { useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider } from 'tamagui'
import { Platform, useColorScheme } from 'react-native'
import jellifyConfig from './tamagui.config'
import { clientPersister } from './src/constants/storage'
import { queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import TrackPlayer, {
	AndroidAudioContentType,
	IOSCategory,
	IOSCategoryOptions,
} from 'react-native-track-player'
import { CAPABILITIES } from './src/player/constants'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { JellifyDarkTheme, JellifyLightTheme } from './src/components/theme'
import { requestStoragePermission } from './src/utils/permisson-helpers'
import ErrorBoundary from './src/components/ErrorBoundary'
import OTAUpdateScreen from './src/components/OtaUpdates'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import { SettingsProvider, useThemeSettingContext } from './src/providers/Settings'
import navigationRef from './navigation'

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	const performanceMetrics = usePerformanceMonitor('App', 3)

	const [playerIsReady, setPlayerIsReady] = useState<boolean>(false)

	/**
	 * Enhanced Android buffer settings for gapless playback
	 *
	 * @see
	 */
	const buffers =
		Platform.OS === 'android'
			? {
					maxCacheSize: 50 * 1024, // 50MB cache
					maxBuffer: 30, // 30 seconds buffer
					playBuffer: 2.5, // 2.5 seconds play buffer
					backBuffer: 5, // 5 seconds back buffer
				}
			: {}

	TrackPlayer.setupPlayer({
		autoHandleInterruptions: true,
		iosCategory: IOSCategory.Playback,
		iosCategoryOptions: [IOSCategoryOptions.AllowAirPlay, IOSCategoryOptions.AllowBluetooth],
		androidAudioContentType: AndroidAudioContentType.Music,
		minBuffer: 30, // 30 seconds minimum buffer
		...buffers,
	})
		.then(() =>
			TrackPlayer.updateOptions({
				capabilities: CAPABILITIES,
				notificationCapabilities: CAPABILITIES,
				// Reduced interval for smoother progress tracking and earlier prefetch detection
				progressUpdateEventInterval: 5,
			}),
		)
		.finally(() => {
			setPlayerIsReady(true)
			requestStoragePermission()
		})

	const [reloader, setReloader] = useState(0)

	const handleRetry = () => setReloader((r) => r + 1)

	return (
		<React.StrictMode>
			<SafeAreaProvider>
				<OTAUpdateScreen />
				<ErrorBoundary reloader={reloader} onRetry={handleRetry}>
					<SettingsProvider>
						<Container playerIsReady={playerIsReady} />
					</SettingsProvider>
				</ErrorBoundary>
			</SafeAreaProvider>
		</React.StrictMode>
	)
}

function Container({ playerIsReady }: { playerIsReady: boolean }): React.JSX.Element {
	const theme = useThemeSettingContext()

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
						: JellifyLightTheme
			}
		>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister: clientPersister,

					/**
					 * Infinity, since data can remain the
					 * same forever on the server
					 */
					maxAge: Infinity,
				}}
			>
				<GestureHandlerRootView>
					<TamaguiProvider config={jellifyConfig}>
						{playerIsReady && <Jellify />}
					</TamaguiProvider>
				</GestureHandlerRootView>
			</PersistQueryClientProvider>
		</NavigationContainer>
	)
}
