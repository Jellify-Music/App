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
import { useTheme } from 'tamagui'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../constants/toast.config'
/**
 * The main component for the Jellify app. Children are wrapped in the {@link JellifyProvider}
 * @returns The {@link Jellify} component
 */
export default function Jellify(): React.JSX.Element {
	const theme = useTheme()

	return (
		<SettingsProvider>
			<JellifyLoggingWrapper>
				<DisplayProvider>
					<JellifyProvider>
						<App />
					</JellifyProvider>
				</DisplayProvider>
			</JellifyLoggingWrapper>
			<Toast config={JellifyToastConfig(theme)} />
		</SettingsProvider>
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
		Sentry.init(glitchtipConfig)
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
		</JellifyUserDataProvider>
	)
}
