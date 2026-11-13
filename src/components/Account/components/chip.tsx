import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import { ThemeTokens, XStack, YStack, SizableText } from 'tamagui'
import Icon from '../../Global/components/icon'

export default function ServerInfoChip({
	label,
	value,
	icon,
	color = 'borderColor',
}: {
	label: string
	value: string
	icon: MaterialDesignIconsIconName
	color?: ThemeTokens
}) {
	return (
		<XStack flex={1} minWidth={140} alignItems='center' gap='2' padding='2' borderRadius='3'>
			<Icon name={icon} color={color} size='7' />
			<YStack flex={1}>
				<SizableText fontSize='2' fontWeight='6' numberOfLines={1}>
					{value}
				</SizableText>
				<SizableText fontSize='2' color='borderColor'>
					{label}
				</SizableText>
			</YStack>
		</XStack>
	)
}
