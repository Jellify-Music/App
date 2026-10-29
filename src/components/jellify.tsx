import React, { useEffect } from 'react'
import Root from '../screens'
import { DisplayProvider } from '../providers/Display/display-provider'
import { Theme, ThemeName, useTheme } from 'tamagui'
import Toast from 'react-native-toast-message'
import JellifyToastConfig from '../configs/styling/toast'
import { useColorScheme } from 'react-native'
import { StorageProvider } from '../providers/Storage'
import {
	useColorPresetSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../stores/settings/app'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
			<DisplayProvider>
				<App />
			</DisplayProvider>
		</Theme>
	)
}

/**
 * The main component for the Jellify app
 * @returns The {@link App} component
 */
function App(): React.JSX.Element {
	const [sendMetrics] = useSendMetricsSetting()
	const theme = useTheme()

	const { top } = useSafeAreaInsets()

	useEffect(() => {
		if (sendMetrics) {
			console.log('Jellify launched')
		}
	}, [sendMetrics])

	return (
		<StorageProvider>
			<Root />
			<Toast topOffset={top} config={JellifyToastConfig(theme)} />
		</StorageProvider>
	)
}
