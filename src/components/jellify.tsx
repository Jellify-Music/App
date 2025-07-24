import _ from 'lodash'
import React, { useEffect } from 'react'
import Root from '../screens'
import { PlayerProvider } from '../providers/Player'
import { JellifyProvider, useJellifyContext } from '../providers'
import { JellifyUserDataProvider } from '../providers/UserData'
import { NetworkContextProvider } from '../providers/Network'
import { QueueProvider } from '../providers/Player/queue'
import { DisplayProvider } from '../providers/Display/display-provider'
import { SettingsProvider, useSettingsContext } from '../providers/Settings'
import {
	createTelemetryDeck,
	TelemetryDeckProvider,
	useTelemetryDeck,
} from '@typedigital/telemetrydeck-react'
import telemetryDeckConfig from '../../telemetrydeck.json'
import glitchtipConfig from '../../glitchtip.json'
import * as Sentry from '@sentry/react-native'
import { Theme, useTheme } from 'tamagui'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../constants/toast.config'
import { useColorScheme } from 'react-native'
/**
 * The main component for the Jellify app. Children are wrapped in the {@link JellifyProvider}
 * @returns The {@link Jellify} component
 */
export default function Jellify(): React.JSX.Element {
	const { theme } = useSettingsContext()

	const isDarkMode = useColorScheme() === 'dark'

	return (
		<Theme name={theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme}>
			<JellifyLoggingWrapper>
				<DisplayProvider>
					<JellifyProvider>
						<App />
					</JellifyProvider>
				</DisplayProvider>
			</JellifyLoggingWrapper>
		</Theme>
	)
}

function JellifyLoggingWrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
	const { sendMetrics } = useSettingsContext()

	/**
	 * Create the TelemetryDeck instance, which is used to send telemetry data to the server
	 *
	 * We will always wrap the app with this provider, but we won't send signal data if we're not sending metrics
	 *
	 * @see https://github.com/typedigital/telemetrydeck-react
	 */
	const telemetrydeck = createTelemetryDeck(telemetryDeckConfig)

	// only initialize Sentry when we actually have a valid DSN and are sending metrics
	if (sendMetrics && glitchtipConfig.dsn) {
		Sentry.init({ ...glitchtipConfig, enableNative: !__DEV__ })
	}

	return <TelemetryDeckProvider telemetryDeck={telemetrydeck}>{children}</TelemetryDeckProvider>
}

/**
 * The main component for the Jellify app. Depends on {@link useJellifyContext} hook to determine if the user is logged in
 * @returns The {@link App} component
 */
function App(): React.JSX.Element {
	const { sendMetrics } = useSettingsContext()
	const telemetrydeck = useTelemetryDeck()
	const theme = useTheme()

	useEffect(() => {
		if (sendMetrics) {
			telemetrydeck.signal('Jellify launched')
		}
	}, [sendMetrics])

	return (
		<JellifyUserDataProvider>
			<NetworkContextProvider>
				<QueueProvider>
					<PlayerProvider>
						<Root />
					</PlayerProvider>
				</QueueProvider>
			</NetworkContextProvider>
			<Toast config={JellifyToastConfig(theme)} />
		</JellifyUserDataProvider>
	)
}
