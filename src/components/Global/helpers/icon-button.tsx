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
	testID?: string | undefined
}

export default function IconButton({
	name,
	onPress,
	title,
	circular,
	testID,
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
			padding={'$1'}
		>
			<Icon
				large={largeIcon}
				small={!largeIcon}
				name={name}
				disabled={disabled}
				color={'$primary'}
				testID={testID ?? undefined}
			/>

			{title && (
				<Text textAlign='center' fontSize={'$2'}>
					{title}
				</Text>
			)}
		</Square>
	)
}
