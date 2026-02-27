import React from 'react'
import { ScrollView, YStack, XStack, SizableText, Avatar, Card } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../Global/components/icon'
import Button from '../../Global/helpers/button'
import StatusBar from '../../Global/helpers/status-bar'
import { SettingsStackParamList } from '../../../screens/Settings/types'
import { useJellifyUser, useJellifyServer } from '../../../stores'
import HTTPS from '../../../constants/protocols'

import SettingsNavRow from './settings-nav-row'

export default function VerticalSettings(): React.JSX.Element {
	const { top } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellifyServer()
	const [user] = useJellifyUser()

	const isSecure = server?.url.includes(HTTPS)

	return (
		<YStack flex={1} backgroundColor='$background'>
			<YStack height={top} backgroundColor='$primary' />
			<StatusBar invertColors />

			<ScrollView
				contentContainerStyle={{ paddingBottom: 160 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Tappable Profile Header */}
				<Card
					backgroundColor='$primary'
					borderRadius={0}
					paddingHorizontal='$4'
					paddingVertical='$4'
					marginBottom='$2'
					pressStyle={{ opacity: 0.8 }}
					animation='quick'
					onPress={() => navigation.navigate('Account')}
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
						<Icon name='chevron-right' color='$background50' />
					</XStack>
				</Card>

				<SettingsNavRow
					title='Appearance'
					icon='palette'
					route='Appearance'
					iconColor='$primary'
				/>
				<SettingsNavRow
					title='Gestures'
					icon='gesture-swipe'
					route='Gestures'
					iconColor='$success'
				/>
				<SettingsNavRow
					title='Playback'
					icon='play-circle'
					route='Playback'
					iconColor='$warning'
				/>
				<SettingsNavRow
					title='Storage'
					icon='harddisk'
					route='StorageManagement'
					iconColor='$primary'
				/>
				<SettingsNavRow
					title='Privacy & Developer'
					icon='shield-account'
					route='PrivacyDeveloper'
					iconColor='$success'
				/>
				<SettingsNavRow
					title='About'
					icon='information'
					route='About'
					iconColor='$primary'
				/>

				{/* Sign Out Button */}
				<YStack paddingHorizontal='$3' paddingVertical='$4'>
					<Button
						size='$4'
						backgroundColor='$danger'
						color='$background'
						onPress={() => navigation.navigate('SignOut')}
						icon={<Icon name='logout' color='$background' />}
					>
						Sign Out
					</Button>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
