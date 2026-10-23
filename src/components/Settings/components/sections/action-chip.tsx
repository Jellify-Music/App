import React from 'react'
import { SizableText } from 'tamagui'
import Button from '../../../Global/helpers/button'
import Icon from '../../../Global/components/icon'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

interface ActionChipProps {
	active: boolean
	label: string
	icon: MaterialDesignIconsIconName
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
			backgroundColor={{ default: active ? 'success' : 'transparent', press: 'neutral' }}
			onPress={onPress}
			borderColor={active ? 'success' : 'borderColor'}
			borderWidth={1}
			padding='2'
			size='xs'
			borderRadius={Infinity}
			icon={<Icon name={icon} color={active ? 'background' : 'color'} size='7' />}
		>
			<SizableText fontWeight={'6'} color={`${active ? 'background' : 'color'}`} size='2'>
				{label}
			</SizableText>
		</Button>
	)
}
