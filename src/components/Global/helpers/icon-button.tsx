import React from 'react'
import { Square, Theme } from 'tamagui'
import Icon from '../components/icon'
import { TouchableOpacity } from 'react-native'
import { Text } from './text'

interface IconButtonProps {
	onPress: () => void
	name: string
	title?: string | undefined
	circular?: boolean | undefined
	size?: number
	largeIcon?: boolean | undefined
	disabled?: boolean | undefined
}

export default function IconButton({
	name,
	onPress,
	title,
	circular,
	size,
	largeIcon,
	disabled,
}: IconButtonProps): React.JSX.Element {
	return (
		<Square
			animation={'bouncy'}
			borderRadius={!circular ? '$4' : undefined}
			circular={circular}
			elevate
			hoverStyle={{ scale: 0.925 }}
			pressStyle={{ scale: 0.875 }}
			onPress={onPress}
			width={size}
			height={size}
			alignContent='center'
			justifyContent='center'
			backgroundColor={'transparent'}
			borderWidth={'$1.5'}
			borderColor={'$primary'}
		>
			<Icon
				large={largeIcon}
				small={!largeIcon}
				name={name}
				disabled={disabled}
				color={'$primary'}
			/>

			{title && <Text textAlign='center'>{title}</Text>}
		</Square>
	)
}
