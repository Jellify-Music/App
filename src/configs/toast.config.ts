import { BaseToast, BaseToastProps, ToastConfig } from 'react-native-toast-message'
import { ThemeParsed } from 'tamagui'
import Icon from '../components/Global/components/icon'

/**
 * Configures the toast for the Jellify app, using Tamagui style tokens
 * @param isDarkMode Whether the app is in dark mode, taken from the useColorScheme hook
 * @returns The {@link ToastConfig} for the Jellify app
 */
const JellifyToastConfig: (theme: ThemeParsed) => ToastConfig = (theme: ThemeParsed) => ({
	success: (props: BaseToastProps) =>
		BaseToast({
			...props,
			style: {
				borderLeftColor: theme.success.val,
				backgroundColor: theme.background.val,
			},
			text1Style: {
				fontFamily: 'Figtree-Bold',
				color: theme.color.val,
			},
			text2Style: {
				fontFamily: 'Figtree-Bold',
				color: theme.neutral.val,
			},
		}),
	error: (props: BaseToastProps) =>
		BaseToast({
			...props,
			style: {
				borderLeftColor: theme.danger.val,
				backgroundColor: theme.background.val,
			},
			text1Style: {
				fontFamily: 'Figtree-Bold',
				color: theme.color.val,
			},
			text2Style: {
				fontFamily: 'Figtree-Bold',
				color: theme.neutral.val,
			},
		}),
})

export default JellifyToastConfig
