import { useColorScheme } from 'react-native'
import { useThemeSetting } from '../stores/settings/app'

/**
 * A hook that returns whether the user is
 * running Jellify under a light mode configuration, be it
 * configured at the app level or at the system level
 *
 * App level settings will _always_ override the system level
 * settings
 */
export default function useIsLightMode() {
	const [themeSetting] = useThemeSetting()

	const systemSetting = useColorScheme()

	switch (themeSetting) {
		case 'light':
			return true
		case 'dark':
		case 'oled':
			return false
		default:
			return systemSetting === 'light'
	}
}
