import React from 'react'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
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
}): React.JSX.Element {
	const theme = useTheme()
	const size = extraLarge ? extraLargeSize : large ? largeSize : small ? smallSize : regularSize

	return (
		<YStack
			alignContent='center'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			padding={'$1'}
			width={size + getToken('$1.5')}
			height={size + getToken('$1.5')}
			flex={flex}
		>
			<MaterialCommunityIcons
				color={
					color && !disabled
						? theme[color]?.val
						: disabled
							? theme.neutral.val
							: theme.color.val
				}
				name={name}
				size={size}
			/>
		</YStack>
	)
}
