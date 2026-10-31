import React from 'react'
import { YStack, XStack, SizableText, ScrollView, Avatar, Card, ThemeTokens } from 'tamagui'
import { useJellyfinServer } from '../../hooks/auth/server'
import { usePublicServerInfo } from '../../api/queries/public-server-info'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/helpers/button'
import SettingsSection from '../../components/Settings/components/settings-section'
import { SettingsStackParamList } from './types'
import { useJellifyUser, useJellifyLibrary } from '../../stores/auth'
import HTTPS from '../../constants/protocols'
import getUserImageUrl from '../../api/queries/image/utils/avatar'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'

export default function AccountScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellyfinServer()
	const { data: serverInfo } = usePublicServerInfo()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const isSecure = server?.url?.includes(HTTPS)

	const userAvatarUrl = getUserImageUrl()

	return (
		<YStack flex={1} backgroundColor='background' testID='settings-screen-account'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Header */}
				<Card
					backgroundColor='primary'
					borderRadius={0}
					paddingHorizontal='4'
					paddingVertical='5'
					marginBottom='2'
				>
					<YStack alignItems='center' gap='3'>
						<Avatar circular size='8' backgroundColor='background25'>
							<Avatar.Image src={userAvatarUrl} />
							<Avatar.Fallback>
								<YStack alignItems='center' justifyContent='center' flex={1}>
									<Icon size='10' name='account-music' color='background' />
								</YStack>
							</Avatar.Fallback>
						</Avatar>
						<YStack alignItems='center' gap='1'>
							<SizableText fontSize='3' fontWeight='6' color='background'>
								{user?.name ?? 'Unknown User'}
							</SizableText>
							<SizableText fontSize='2' color='background'>
								Jellyfin User
							</SizableText>
						</YStack>
					</YStack>
				</Card>

				{/* Library Section */}
				<SettingsSection
					title='Music Library'
					icon='book-music'
					iconColor='primary'
					defaultExpanded
					collapsible={false}
				>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='2'
						backgroundColor='background-focus'
						borderRadius='3'
					>
						<XStack alignItems='center' gap='3' flex={1}>
							<YStack
								width={40}
								height={40}
								borderRadius='2'
								backgroundColor='primary'
								alignItems='center'
								justifyContent='center'
							>
								<Icon name='music-box-multiple' color='background' size='7' />
							</YStack>
							<YStack flex={1}>
								<SizableText fontSize='2' fontWeight='6'>
									{library?.musicLibraryName ?? 'Unknown Library'}
								</SizableText>
								<SizableText fontSize='2' color='borderColor'>
									Current library
								</SizableText>
							</YStack>
						</XStack>
						<Button
							testID='account-change-library-button'
							backgroundColor='transparent'
							borderColor='borderColor'
							borderWidth={1}
							paddingHorizontal='2'
							onPress={() => navigation.navigate('LibrarySelection')}
							icon={<Icon name='swap-horizontal' color='color' size='7' />}
						>
							<SizableText fontSize='2'>Change</SizableText>
						</Button>
					</XStack>
				</SettingsSection>

				{/* Server Section */}
				<SettingsSection
					title='Server'
					icon={isSecure ? 'lock' : 'lock-open'}
					iconColor={isSecure ? 'success' : 'warning'}
					defaultExpanded
					collapsible={false}
				>
					<YStack gap='3'>
						<XStack alignItems='center' gap='3'>
							<YStack
								width={40}
								height={40}
								borderRadius='2'
								backgroundColor={`${isSecure ? 'success' : 'warning'}`}
								alignItems='center'
								justifyContent='center'
							>
								<Icon name='server' color='background' size='7' />
							</YStack>
							<YStack flex={1}>
								<SizableText fontSize='3' fontWeight='6'>
									{serverInfo?.ServerName ?? 'Unknown Server'}
								</SizableText>
								<SizableText fontSize='2' color='borderColor'>
									{server?.url ?? 'Unknown Address'}
								</SizableText>
							</YStack>
						</XStack>

						<XStack flexWrap='wrap' gap='2'>
							<ServerInfoChip
								label='Version'
								value={serverInfo?.Version ?? 'Unknown'}
								icon='information'
							/>
							<ServerInfoChip
								label='Connection'
								value={isSecure ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}
								icon={isSecure ? 'shield-check' : 'shield-alert'}
								color={isSecure ? 'success' : 'warning'}
							/>
						</XStack>
					</YStack>
				</SettingsSection>
			</ScrollView>
		</YStack>
	)
}

function ServerInfoChip({
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
		<XStack
			flex={1}
			minWidth={140}
			alignItems='center'
			gap='2'
			padding='2'
			backgroundColor='background-focus'
			borderRadius='3'
		>
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
