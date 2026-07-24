import React from 'react'
import { getTokenValue, SizeTokens, ThemeTokens, useTheme, YStack, YStackProps } from 'tamagui'
import MaterialDesignIcon, {
	MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons'

const xxxsmallSize = 12
const xxsmallSize = 16
const xsmallSize = 20
const smallSize = 28
const regularSize = 34
const largeSize = 44

const SIZE_ENTRIES = [
	['large', largeSize],
	['small', smallSize],
	['xsmall', xsmallSize],
	['xxsmall', xxsmallSize],
	['xxxsmall', xxxsmallSize],
] as const

interface IconProps extends YStackProps {
	name: MaterialDesignIconsIconName
	margin?: SizeTokens | undefined
	xxxsmall?: boolean
	xxsmall?: boolean
	xsmall?: boolean
	small?: boolean
	large?: boolean
	disabled?: boolean
	color?: ThemeTokens | '$white' | '$black' | '$offwhite' | undefined
	flex?: number | undefined
	testID?: string | undefined
	textOutline?: 'none' | 'strong'
}

export default function Icon({
	name,
	margin,
	onPress,
	onPressIn,
	xxxsmall,
	xxsmall,
	xsmall,
	small,
	large,
	disabled,
	color,
	flex,
	testID,
	textOutline,
	...props
}: IconProps): React.JSX.Element {
	const theme = useTheme()
	const sizeProps = { large, small, xsmall, xxsmall, xxxsmall }
	const size = SIZE_ENTRIES.find(([key]) => sizeProps[key])?.[1] ?? regularSize

	const animation = onPress || onPressIn ? 'quick' : undefined

	const pressStyle = animation ? { opacity: 0.6 } : undefined

	// Tamagui theme keys are unprefixed (e.g. "primary" not "$primary"); resolve for token strings
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
			pressStyle={pressStyle}
			alignContent='center'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			hitSlop={getTokenValue('$2.5')}
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
				size={size}
				testID={testID ?? undefined}
			/>
		</YStack>
	)
}
