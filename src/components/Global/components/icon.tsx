import React from 'react'
import {
	AnimationKeys,
	ColorTokens,
	getToken,
	getTokens,
	getTokenValue,
	themeable,
	ThemeTokens,
	Tokens,
	useTheme,
	YStack,
} from 'tamagui'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'
import { on } from 'events'

const xxsmallSize = 16

const xsmallSize = 20

const smallSize = 28

const regularSize = 34

const largeSize = 44

export default function Icon({
	name,
	onPress,
	onPressIn,
	xxsmall,
	xsmall,
	small,
	large,
	disabled,
	color,
	flex,
	testID,
}: {
	name: string
	onPress?: () => void
	onPressIn?: () => void
	xxsmall?: boolean
	xsmall?: boolean
	small?: boolean
	large?: boolean
	disabled?: boolean
	color?: ThemeTokens | undefined
	flex?: number | undefined
	testID?: string | undefined
}): React.JSX.Element {
	const theme = useTheme()
	const size = large
		? largeSize
		: small
			? smallSize
			: xsmall
				? xsmallSize
				: xxsmall
					? xxsmallSize
					: regularSize

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
			animation={animation}
			pressStyle={pressStyle}
			alignContent='center'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			hitSlop={getTokenValue('$2.5')}
			flex={flex}
		>
			<MaterialDesignIcon
				color={resolvedColor}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				name={name as any}
				size={size}
				testID={testID ?? undefined}
			/>
		</YStack>
	)
}
