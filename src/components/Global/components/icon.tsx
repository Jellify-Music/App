import React from 'react'
import {
	ColorTokens,
	getToken,
	getTokens,
	themeable,
	ThemeTokens,
	Tokens,
	useTheme,
	YStack,
} from 'tamagui'
import MaterialDesignIcon from '@react-native-vector-icons/material-design-icons'

const smallSize = 30

const regularSize = 36

const largeSize = 48

const extraLargeSize = 96

export default function Icon({
	name,
	onPress,
	onPressIn,
	small,
	large,
	extraLarge,
	disabled,
	color,
	flex,
	testID,
}: {
	name: string
	onPress?: () => void
	onPressIn?: () => void
	small?: boolean
	large?: boolean
	disabled?: boolean
	extraLarge?: boolean
	color?: ThemeTokens | undefined
	flex?: number | undefined
	testID?: string | undefined
}): React.JSX.Element {
	const theme = useTheme()
	const size = extraLarge ? extraLargeSize : large ? largeSize : small ? smallSize : regularSize

	return (
		<YStack
			alignContent='center'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			paddingHorizontal={'$0.5'}
			width={size + getToken('$1')}
			height={size + getToken('$1')}
			flex={flex}
		>
			<MaterialDesignIcon
				color={
					color && !disabled
						? theme[color]?.val
						: disabled
							? theme.neutral.val
							: theme.color.val
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				name={name as any}
				size={size}
				testID={testID ?? undefined}
			/>
		</YStack>
	)
}
