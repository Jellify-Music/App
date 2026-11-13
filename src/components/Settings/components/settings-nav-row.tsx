import React from 'react'
import { XStack, SizableText, Card, ThemeTokens } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../Global/components/icon'
import { SettingsStackParamList } from '../../../screens/Settings/types'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

interface SettingsNavRowProps {
	title: string
	icon: MaterialDesignIconsIconName
	route: keyof SettingsStackParamList
	iconColor?: ThemeTokens
	description?: string
	testID?: string
}

export default function SettingsNavRow({
	title,
	icon,
	route,
	iconColor = 'borderColor',
	description,
	testID,
}: SettingsNavRowProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const onPress = () => navigation.navigate(route)

	return (
		<Card
			testID={testID}
			borderBottomWidth={'0-5'}
			borderColor='borderColor'
			backgroundColor='background'
			marginVertical='1'
			opacity='1 press:0.7'
			onPress={onPress}
		>
			<XStack
				paddingHorizontal='3'
				paddingVertical='3'
				alignItems='center'
				justifyContent='space-between'
			>
				<XStack alignItems='center' gap='3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText fontSize='3' fontWeight='6'>
						{title}
					</SizableText>
					{description && (
						<SizableText fontSize='2' color='borderColor'>
							{description}
						</SizableText>
					)}
				</XStack>
				<Icon name='chevron-right' color='borderColor' size='7' />
			</XStack>
		</Card>
	)
}
