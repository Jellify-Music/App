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

	return (
		<Card
			testID={testID}
			borderWidth={'1'}
			borderColor='borderColor'
			backgroundColor='background'
			marginHorizontal='3'
			marginVertical='1-5'
			padding='0'
			opacity='1 press:0.7'
			borderRadius='4'
			onPress={() => navigation.navigate(route)}
		>
			<XStack
				paddingHorizontal='3'
				paddingVertical='3'
				alignItems='center'
				justifyContent='space-between'
			>
				<XStack alignItems='center' gap='3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText size='2' fontWeight='6'>
						{title}
					</SizableText>
					{description && (
						<SizableText size='1' color='borderColor'>
							{description}
						</SizableText>
					)}
				</XStack>
				<Icon name='chevron-right' color='borderColor' size='7' />
			</XStack>
		</Card>
	)
}
