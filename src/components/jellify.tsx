import React, { useEffect } from 'react'
import Root from '../screens'
import { DisplayProvider } from '../providers/Display/display-provider'
import {
	createTelemetryDeck,
	TelemetryDeckProvider,
	useTelemetryDeck,
} from '@typedigital/telemetrydeck-react'
import { TELEMETRYDECK_APPID } from '../configs/config'
import { Theme, ThemeName, useTheme } from 'tamagui'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../configs/toast.config'
import { useColorScheme } from 'react-native'
import { StorageProvider } from '../providers/Storage'
import {
	useColorPresetSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../stores/settings/app'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Create the TelemetryDeck instance, which is used to send telemetry data to the server
 *
 * We will always wrap the app with this provider, but we won't send signal data if we're not sending metrics
 *
 * @see https://github.com/typedigital/telemetrydeck-react
 */
const telemetrydeck = createTelemetryDeck({
	appID: TELEMETRYDECK_APPID,
	clientUser: 'anonymous',
	testMode: __DEV__,
})

/**
 * The main component for the Jellify app. Children are wrapped in the {@link JellifyProvider}
 * @returns The {@link Jellify} component
 */
export default function Jellify(): React.JSX.Element {
	const [theme] = useThemeSetting()
	const [colorPreset] = useColorPresetSetting()

	const isDarkMode = useColorScheme() === 'dark'

	const resolvedMode = theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme
	const themeName = `${colorPreset}_${resolvedMode}` // e.g. 'purple_dark'

	return (
		<Theme name={themeName as ThemeName | null}>
			<JellifyLoggingWrapper>
				<DisplayProvider>
					<App />
				</DisplayProvider>
			</JellifyLoggingWrapper>
		</Theme>
	)
}

function JellifyLoggingWrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <TelemetryDeckProvider telemetryDeck={telemetrydeck}>{children}</TelemetryDeckProvider>
}

/**
 * The main component for the Jellify app
 * @returns The {@link App} component
 */
function App(): React.JSX.Element {
	const [sendMetrics] = useSendMetricsSetting()
	const telemetrydeck = useTelemetryDeck()
	const theme = useTheme()

	const { top } = useSafeAreaInsets()

	useEffect(() => {
		if (sendMetrics) {
			telemetrydeck.signal('Jellify launched')
		}
	}, [sendMetrics])

	return (
		<StorageProvider>
			<Root />
			<Toast topOffset={top} config={JellifyToastConfig(theme)} />
		</StorageProvider>
	)
}
