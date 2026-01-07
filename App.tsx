import './gesture-handler'
import React, { useEffect, useRef, useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider } from 'tamagui'
import { LogBox, Platform, useColorScheme } from 'react-native'
import jellifyConfig from './tamagui.config'
import { queryClientPersister } from './src/constants/storage'
import { ONE_DAY, queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import TrackPlayer, {
	AndroidAudioContentType,
	AppKilledPlaybackBehavior,
	IOSCategory,
	IOSCategoryOptions,
} from 'react-native-track-player'
import { CAPABILITIES } from './src/constants/player'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { JellifyDarkTheme, JellifyLightTheme, JellifyOLEDTheme } from './src/components/theme'
import { requestStoragePermission } from './src/utils/permisson-helpers'
import ErrorBoundary from './src/components/ErrorBoundary'
import OTAUpdateScreen from './src/components/OtaUpdates'
import { usePerformanceMonitor } from './src/hooks/use-performance-monitor'
import navigationRef from './navigation'
import { BUFFERS, PROGRESS_UPDATE_EVENT_INTERVAL } from './src/configs/player.config'
import { useThemeSetting } from './src/stores/settings/app'
import { useLoadNewQueue } from './src/providers/Player/hooks/mutations'
import useJellifyStore, { getApi } from './src/stores'
import CarPlayNavigation from './src/components/CarPlay/Navigation'
import { CarPlay } from 'react-native-carplay'
import { useAutoStore } from './src/stores/auto'
import { registerAutoService } from './src/player'

LogBox.ignoreAllLogs()

export default function App(): React.JSX.Element {
	// Add performance monitoring to track app-level re-renders
	usePerformanceMonitor('App', 3)

	const [playerIsReady, setPlayerIsReady] = useState<boolean>(false)

	const { setIsConnected } = useAutoStore()

	const playerInitializedRef = useRef<boolean>(false)

	const loadNewQueue = useLoadNewQueue()

	const onConnect = () => {
		const api = getApi()
		const library = useJellifyStore.getState().library

		if (api && library) {
			CarPlay.setRootTemplate(
				CarPlayNavigation(library, loadNewQueue, useJellifyStore.getState().user),
			)

			if (Platform.OS === 'ios') {
				CarPlay.enableNowPlaying(true)
			}
		}
		setIsConnected(true)
	}

	const onDisconnect = () => setIsConnected(false)

	useEffect(() => {
		// Guard against double initialization (React StrictMode, hot reload)
		if (playerInitializedRef.current) return
		playerInitializedRef.current = true

		TrackPlayer.setupPlayer({
			autoHandleInterruptions: true,
			iosCategory: IOSCategory.Playback,
			iosCategoryOptions: [
				IOSCategoryOptions.AllowAirPlay,
				IOSCategoryOptions.AllowBluetooth,
			],
			androidAudioContentType: AndroidAudioContentType.Music,
			minBuffer: 30, // 30 seconds minimum buffer
			...BUFFERS,
		})
			.then(() =>
				TrackPlayer.updateOptions({
					capabilities: CAPABILITIES,
					notificationCapabilities: CAPABILITIES,
					// Reduced interval for smoother progress tracking and earlier prefetch detection
					progressUpdateEventInterval: PROGRESS_UPDATE_EVENT_INTERVAL,
					// Stop playback and remove notification when app is killed to prevent battery drain
					android: {
						appKilledPlaybackBehavior:
							AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
					},
				}),
			)
			.catch((error) => {
				// Player may already be initialized (e.g., after hot reload)
				// This is expected and not a fatal error
				console.log('[TrackPlayer] Setup caught:', error?.message ?? error)
			})
			.finally(() => {
				setPlayerIsReady(true)
				requestStoragePermission()
			})

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
						persistOptions={{
							persister: queryClientPersister,

							/**
							 * Maximum query data age of one day
							 */
							maxAge: ONE_DAY,
						}}
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
