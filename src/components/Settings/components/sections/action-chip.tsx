import React from 'react'
import { SizableText } from 'tamagui'
import Button from '../../../Global/helpers/button'
import Icon from '../../../Global/components/icon'

interface ActionChipProps {
	active: boolean
	label: string
	icon: string
	onPress: () => void
}

export default function ActionChip({
	active,
	label,
	icon,
	onPress,
}: ActionChipProps): React.JSX.Element {
	return (
		<Button
			pressStyle={{ backgroundColor: '$neutral' }}
			onPress={onPress}
			backgroundColor={active ? '$success' : 'transparent'}
			borderColor={active ? '$success' : '$borderColor'}
			borderWidth='$0.5'
			color={active ? '$background' : '$color'}
			paddingHorizontal='$2.5'
			size='$2'
			borderRadius='$10'
			icon={<Icon name={icon} color={active ? '$background' : '$color'} small />}
		>
			<SizableText color={active ? '$background' : '$color'} size='$2'>
				{label}
			</SizableText>
		</Button>
	)
}
