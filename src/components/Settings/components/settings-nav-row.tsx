import React from 'react'
import { XStack, SizableText, Card } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeTokens } from 'tamagui'

import Icon from '../../Global/components/icon'
import { SettingsStackParamList } from '../../../screens/Settings/types'

interface SettingsNavRowProps {
	title: string
	icon: string
	route: keyof SettingsStackParamList
	iconColor?: ThemeTokens
	description?: string
}

export default function SettingsNavRow({
	title,
	icon,
	route,
	iconColor = '$borderColor',
	description,
}: SettingsNavRowProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	return (
		<Card
			bordered
			backgroundColor='$background'
			marginHorizontal='$3'
			marginVertical='$1.5'
			padding='$0'
			pressStyle={{ opacity: 0.7 }}
			onPress={() => navigation.navigate(route)}
		>
			<XStack
				paddingHorizontal='$3'
				paddingVertical='$3'
				alignItems='center'
				justifyContent='space-between'
			>
				<XStack alignItems='center' gap='$3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText size='$5' fontWeight='600'>
						{title}
					</SizableText>
					{description && (
						<SizableText size='$3' color='$gray10'>
							{description}
						</SizableText>
					)}
				</XStack>
				<Icon name='chevron-right' color='$borderColor' small />
			</XStack>
		</Card>
	)
}
