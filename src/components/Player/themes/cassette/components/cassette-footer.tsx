import React from 'react'
import { XStack } from 'tamagui'
import Icon from '../../../../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '../../../../../screens/Player/types'
import GoogleCast from 'react-native-google-cast'

export default function CassetteFooter(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	return (
		<XStack justifyContent='center' gap='$6' paddingVertical='$2'>
			{/* Cast button */}
			<FooterButton icon='cast' onPress={() => GoogleCast.showCastDialog()} />

			{/* Queue button */}
			<FooterButton
				icon='playlist-music'
				onPress={() => navigation.navigate('QueueScreen')}
			/>
		</XStack>
	)
}

interface FooterButtonProps {
	icon: string
	onPress: () => void
	active?: boolean
}

function FooterButton({ icon, onPress, active }: FooterButtonProps): React.JSX.Element {
	return (
		<XStack
			width={44}
			height={44}
			borderRadius={22}
			backgroundColor='#2A2A2A'
			alignItems='center'
			justifyContent='center'
			onPress={onPress}
			pressStyle={{ scale: 0.9, opacity: 0.8 }}
			animation='quick'
			borderWidth={1}
			borderColor='#3A3A3A'
		>
			<Icon name={icon} color={active ? '$warning' : '$borderColor'} small />
		</XStack>
	)
}
