import React from 'react'
import { SizableText } from 'tamagui'
import Button from '../../../Global/helpers/button'
import Icon from '../../../Global/components/icon'

interface ActionChipProps {
	active: boolean
	label: string
	icon: string
	onPress: () => void
	testID?: string
}

export default function ActionChip({
	active,
	label,
	icon,
	onPress,
	testID,
}: ActionChipProps): React.JSX.Element {
	return (
		<Button
			testID={testID}
			pressStyle={{ backgroundColor: '$neutral' }}
			onPress={onPress}
			backgroundColor={active ? '$success' : 'transparent'}
			borderColor={active ? '$success' : '$borderColor'}
			borderWidth={1}
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
