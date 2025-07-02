import './gesture-handler'
import React, { useState } from 'react'
import 'react-native-url-polyfill/auto'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import Jellify from './src/components/jellify'
import { TamaguiProvider, Theme, useTheme } from 'tamagui'
import { useColorScheme } from 'react-native'
import jellifyConfig from './tamagui.config'
import { clientPersister } from './src/constants/storage'
import { queryClient } from './src/constants/query-client'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import TrackPlayer, { IOSCategory, IOSCategoryOptions } from 'react-native-track-player'
import { CAPABILITIES } from './src/player/constants'
import { createWorkletRuntime } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { JellifyDarkTheme, JellifyLightTheme } from './src/components/theme'
import { requestStoragePermission } from './src/helpers/permisson-helpers'
import ErrorBoundary from './src/components/ErrorBoundary'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from './src/constants/toast.config'
import OTAUpdateScreen from './src/components/OtaUpdates'

export const backgroundRuntime = createWorkletRuntime('background')

export default function App(): React.JSX.Element {
	const [playerIsReady, setPlayerIsReady] = useState<boolean>(false)
	const isDarkMode = useColorScheme() === 'dark'

	TrackPlayer.setupPlayer({
		autoHandleInterruptions: true,
		iosCategory: IOSCategory.Playback,
		iosCategoryOptions: [IOSCategoryOptions.AllowAirPlay, IOSCategoryOptions.AllowBluetooth],
		// Enhanced buffer settings for gapless playback
		maxCacheSize: 50 * 1024 * 1024, // 50MB cache
		maxBuffer: 30000, // 30 seconds buffer
		minBuffer: 15000, // 15 seconds minimum buffer
		playBuffer: 2500, // 2.5 seconds play buffer
		backBuffer: 5000, // 5 seconds back buffer
	})
		.then(() =>
			TrackPlayer.updateOptions({
				capabilities: CAPABILITIES,
				notificationCapabilities: CAPABILITIES,
				compactCapabilities: CAPABILITIES,
				// Reduced interval for smoother progress tracking and earlier prefetch detection
				progressUpdateEventInterval: 5,
				// Enable gapless playback
				alwaysPauseOnInterruption: false,
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
					<NavigationContainer theme={isDarkMode ? JellifyDarkTheme : JellifyLightTheme}>
						<PersistQueryClientProvider
							client={queryClient}
							persistOptions={{
								persister: clientPersister,

								/**
								 * Infinity, since data can remain the
								 * same forever on the server
								 */
								maxAge: Infinity,
								buster: '0.10.99',
							}}>
							<GestureHandlerRootView>
								<TamaguiProvider config={jellifyConfig}>
									<Theme name={isDarkMode ? 'dark' : 'light'}>
										{playerIsReady && <Jellify />}
									</Theme>
								</TamaguiProvider>
							</GestureHandlerRootView>
						</PersistQueryClientProvider>
					</NavigationContainer>
				</ErrorBoundary>
			</SafeAreaProvider>
		</React.StrictMode>
	)
}
