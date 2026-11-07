import { ComponentProps } from 'react'
import { BaseToast, BaseToastProps, ToastConfig } from 'react-native-toast-message'
import { ThemeParsed, View } from 'tamagui'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

type IconName = ComponentProps<typeof MaterialDesignIcons>['name']

/**
 * Renders a {@link BaseToast} with Jellify styling and a leading Material Design icon
 * @param props The props passed to the toast by react-native-toast-message
 * @param theme The current Tamagui theme
 * @param icon The Material Design icon to show beside the toast text
 * @param accentColor The color of the leading border and icon
 */
function JellifyToast(
	props: BaseToastProps,
	theme: ThemeParsed,
	icon: IconName,
	accentColor: string,
) {
	return BaseToast({
		...props,
		style: {
			borderLeftColor: accentColor,
			backgroundColor: theme.background.val,
		},
		contentContainerStyle: {
			paddingLeft: 12,
		},
		text1Style: {
			fontSize: 16,
			fontFamily: 'Figtree-Bold',
			fontWeight: 'normal',
			color: theme.color.val,
		},
		text2Style: {
			fontSize: 14,
			fontFamily: 'Figtree-Bold',
			fontWeight: 'normal',
			color: theme.neutral.val,
		},
		renderLeadingIcon: () => (
			<View paddingLeft={'3'} alignItems='center' justifyContent='center'>
				<MaterialDesignIcons name={icon} size={24} color={accentColor} />
			</View>
		),
	})
}

/**
 * Configures the toast for the Jellify app, using Tamagui style tokens
 * @param theme The current Tamagui theme
 * @returns The {@link ToastConfig} for the Jellify app
 */
const JellifyToastConfig: (theme: ThemeParsed) => ToastConfig = (theme: ThemeParsed) => ({
	success: (props: BaseToastProps) => JellifyToast(props, theme, 'check', theme.success.val),
	info: (props: BaseToastProps) => JellifyToast(props, theme, 'information', theme.secondary.val),
	error: (props: BaseToastProps) => JellifyToast(props, theme, 'alert', theme.danger.val),
})

export default JellifyToastConfig
