import React from 'react'
import {
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

const smallSize = 28

const regularSize = 34

const largeSize = 44

export default function Icon({
	name,
	onPress,
	onPressIn,
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
	small?: boolean
	large?: boolean
	disabled?: boolean
	color?: ThemeTokens | undefined
	flex?: number | undefined
	testID?: string | undefined
}): React.JSX.Element {
	const theme = useTheme()
	const size = large ? largeSize : small ? smallSize : regularSize

	return (
		<YStack
			alignContent='flex-start'
			justifyContent='center'
			onPress={onPress}
			onPressIn={onPressIn}
			hitSlop={getTokenValue('$2.5')}
			marginHorizontal={'$1'}
			width={size + getToken('$0.5')}
			height={size + getToken('$0.5')}
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
