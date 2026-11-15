import { ComponentProps, useEffect, useState } from 'react'
import { BaseToast, BaseToastProps, ToastConfig } from 'react-native-toast-message'
import { ThemeParsed, View } from 'tamagui'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { applyHapticFeedback } from '../../utils/haptics'

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
			fontSize: 14,
			fontFamily: 'Figtree-Bold',
			fontWeight: 'normal',
			color: theme.color.val,
		},
		text2Style: {
			fontSize: 12,
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
 * Renders an error toast that, when tapped, runs its onPress (i.e. copying the error
 * to the clipboard), gives haptic feedback, and swaps its icon to a clipboard check
 * @param props The props passed to the toast, plus the current Tamagui theme
 */
function ErrorToast({ theme, ...props }: BaseToastProps & { theme: ThemeParsed }) {
	const [copied, setCopied] = useState(false)

	// The toast instance is reused between toasts, so reset when the content changes
	useEffect(() => setCopied(false), [props.text1, props.text2])

	const onPress = props.onPress
		? () => {
				props.onPress?.()
				applyHapticFeedback('info')
				setCopied(true)
			}
		: undefined

	return JellifyToast(
		{ ...props, onPress },
		theme,
		copied ? 'clipboard-check' : 'alert',
		theme.danger.val,
	)
}

/**
 * Configures the toast for the Jellify app, using Tamagui style tokens
 * @param theme The current Tamagui theme
 * @returns The {@link ToastConfig} for the Jellify app
 */
const JellifyToastConfig: (theme: ThemeParsed) => ToastConfig = (theme: ThemeParsed) => ({
	success: (props: BaseToastProps) => JellifyToast(props, theme, 'check', theme.success.val),
	info: (props: BaseToastProps) => JellifyToast(props, theme, 'information', theme.secondary.val),
	error: (props: BaseToastProps) => <ErrorToast {...props} theme={theme} />,
})

export default JellifyToastConfig
