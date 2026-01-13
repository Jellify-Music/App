import React from 'react'
import { XStack, YStack, SizableText, Card, Avatar } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../../Global/components/icon'
import Button from '../../../Global/helpers/button'
import { SettingsStackParamList } from '../../../../screens/Settings/types'
import { useJellifyUser, useJellifyLibrary, useJellifyServer } from '../../../../stores'
import HTTPS from '../../../../constants/protocols'

export default function UserProfileHeader(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellifyServer()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const isSecure = server?.url.includes(HTTPS)

	return (
		<Card
			backgroundColor='$primary'
			borderRadius={0}
			paddingHorizontal='$4'
			paddingVertical='$4'
			marginBottom='$2'
		>
			<XStack alignItems='center' gap='$3'>
				<Avatar circular size='$6' backgroundColor='$background25'>
					<Avatar.Fallback>
						<Icon name='account-music' color='$background' />
					</Avatar.Fallback>
				</Avatar>
				<YStack flex={1}>
					<SizableText size='$6' fontWeight='bold' color='$background'>
						{user?.name ?? 'Unknown User'}
					</SizableText>
					<XStack alignItems='center' gap='$1.5'>
						<Icon
							name={isSecure ? 'lock' : 'lock-open'}
							color={isSecure ? '$background50' : '$warning'}
							small
						/>
						<SizableText size='$3' color='$background50'>
							{server?.name ?? 'Unknown Server'}
						</SizableText>
					</XStack>
				</YStack>
				<Button
					size='$3'
					backgroundColor='$background25'
					borderColor='$background50'
					borderWidth='$0.5'
					onPress={() => navigation.navigate('LibrarySelection')}
					icon={<Icon name='book-music' color='$background' small />}
				>
					<SizableText color='$background' size='$2'>
						{library?.musicLibraryName ?? 'Library'}
					</SizableText>
				</Button>
			</XStack>
		</Card>
	)
}
