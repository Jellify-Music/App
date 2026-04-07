import React from 'react'
import { Square } from 'tamagui'
import Icon from '../components/icon'
import { Text } from './text'
import { BUTTON_PRESS_STYLES } from '../../../configs/style.config'

interface IconButtonProps {
	onPress: () => Promise<void>
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
			borderRadius={!circular ? '$4' : undefined}
			circular={circular}
			elevate
			{...BUTTON_PRESS_STYLES}
			onPress={onPress}
			width={size}
			height={size}
			alignContent='center'
			justifyContent='center'
			backgroundColor={'transparent'}
			borderWidth={'$1.5'}
			borderColor={'$primary'}
			padding={'$1'}
			testID={testID ?? undefined}
		>
			<Icon
				large={largeIcon}
				small={!largeIcon}
				name={name}
				disabled={disabled}
				color={'$primary'}
			/>

			{title && (
				<Text textAlign='center' fontSize={'$2'}>
					{title}
				</Text>
			)}
		</Square>
	)
}
