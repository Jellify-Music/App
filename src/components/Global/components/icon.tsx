import React from 'react'
import {
	FontSizeTokens,
	getFontSize,
	SizeTokens,
	ThemeTokens,
	useTheme,
	YStack,
	YStackProps,
} from 'tamagui'
import MaterialDesignIcon, {
	MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons'
import { StyleSheet } from 'react-native'

interface IconProps extends YStackProps {
	name: MaterialDesignIconsIconName
	margin?: SizeTokens | undefined
	size?: FontSizeTokens
	disabled?: boolean
	color?: ThemeTokens | 'white' | 'black' | 'offwhite' | undefined
	flex?: number | undefined
	testID?: string | undefined
	textOutline?: 'none' | 'strong'
}

export default function Icon({
	name,
	margin,
	onPress,
	onPressIn,
	size = '8',
	disabled,
	color,
	flex,
	testID,
	textOutline,
	...props
}: IconProps): React.JSX.Element {
	const theme = useTheme()

	const animation = onPress || onPressIn ? 'quick' : props.transition

	const pressOpacity = onPress || onPressIn ? '1 press: 0.6 hover: 0.8' : undefined

	// Tamagui theme keys are unprefixed (e.g. "primary" not "primary"); resolve for token strings
	const themeColorKey =
		color && typeof color === 'string' && color.startsWith('$') ? color.slice(1) : color
	const resolvedColor =
		color && !disabled
			? (theme[themeColorKey as keyof typeof theme]?.val ?? theme.color.val)
			: disabled
				? theme.neutral.val
				: theme.color.val

	return (
		<YStack
			transition={animation}
			opacity={pressOpacity}
			alignContent='center'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			hitSlop={10}
			flex={flex}
			shadowColor={textOutline === 'strong' ? 'rgba(0, 0, 0, 0.9)' : 'transparent'}
			shadowOffset={
				textOutline === 'strong' ? { width: 0.5, height: 0.5 } : { width: 0, height: 0 }
			}
			shadowRadius={textOutline === 'strong' ? 1 : 0}
			margin={margin}
			{...props}
		>
			<MaterialDesignIcon
				color={resolvedColor}
				name={name}
				size={getFontSize(size)}
				testID={testID ?? undefined}
				style={styles.center}
			/>
		</YStack>
	)
}

const styles = StyleSheet.create({
	center: {
		margin: 'auto',
	},
})
