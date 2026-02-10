import React from 'react'
import { YStack, XStack, SizableText, ScrollView, Avatar, Card, ThemeTokens } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/helpers/button'
import SettingsSection from '../../components/Settings/components/settings-section'
import { SettingsStackParamList } from './types'
import { useJellifyUser, useJellifyLibrary, useJellifyServer } from '../../stores'
import HTTPS from '../../constants/protocols'

export default function AccountScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellifyServer()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const isSecure = server?.url.includes(HTTPS)

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Header */}
				<Card
					backgroundColor='$primary'
					borderRadius={0}
					paddingHorizontal='$4'
					paddingVertical='$5'
					marginBottom='$2'
				>
					<YStack alignItems='center' gap='$3'>
						<Avatar circular size='$8' backgroundColor='$background25'>
							<Avatar.Fallback>
								<Icon name='account-music' color='$background' />
							</Avatar.Fallback>
						</Avatar>
						<YStack alignItems='center' gap='$1'>
							<SizableText size='$7' fontWeight='bold' color='$background'>
								{user?.name ?? 'Unknown User'}
							</SizableText>
							<SizableText size='$3' color='$background50'>
								Jellyfin User
							</SizableText>
						</YStack>
					</YStack>
				</Card>

				{/* Library Section */}
				<SettingsSection
					title='Music Library'
					icon='book-music'
					iconColor='$primary'
					defaultExpanded
					collapsible={false}
				>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='$2'
						backgroundColor='$backgroundFocus'
						borderRadius='$3'
					>
						<XStack alignItems='center' gap='$3' flex={1}>
							<YStack
								width={40}
								height={40}
								borderRadius='$2'
								backgroundColor='$primary'
								alignItems='center'
								justifyContent='center'
							>
								<Icon name='music-box-multiple' color='$background' small />
							</YStack>
							<YStack flex={1}>
								<SizableText size='$4' fontWeight='600'>
									{library?.musicLibraryName ?? 'Unknown Library'}
								</SizableText>
								<SizableText size='$2' color='$borderColor'>
									Current library
								</SizableText>
							</YStack>
						</XStack>
						<Button
							size='$3'
							backgroundColor='transparent'
							borderColor='$borderColor'
							borderWidth='$0.5'
							onPress={() => navigation.navigate('LibrarySelection')}
							icon={<Icon name='swap-horizontal' color='$color' small />}
						>
							<SizableText size='$3'>Change</SizableText>
						</Button>
					</XStack>
				</SettingsSection>

				{/* Server Section */}
				<SettingsSection
					title='Server'
					icon={isSecure ? 'lock' : 'lock-open'}
					iconColor={isSecure ? '$success' : '$warning'}
					defaultExpanded
					collapsible={false}
				>
					<YStack gap='$3'>
						<XStack alignItems='center' gap='$3'>
							<YStack
								width={40}
								height={40}
								borderRadius='$2'
								backgroundColor={isSecure ? '$success' : '$warning'}
								alignItems='center'
								justifyContent='center'
							>
								<Icon name='server' color='$background' small />
							</YStack>
							<YStack flex={1}>
								<SizableText size='$4' fontWeight='600'>
									{server?.name ?? 'Unknown Server'}
								</SizableText>
								<SizableText size='$2' color='$borderColor'>
									{server?.address ?? 'Unknown Address'}
								</SizableText>
							</YStack>
						</XStack>

						<XStack flexWrap='wrap' gap='$2'>
							<ServerInfoChip
								label='Version'
								value={server?.version ?? 'Unknown'}
								icon='information'
							/>
							<ServerInfoChip
								label='Connection'
								value={isSecure ? 'Secure (HTTPS)' : 'Insecure (HTTP)'}
								icon={isSecure ? 'shield-check' : 'shield-alert'}
								color={isSecure ? '$success' : '$warning'}
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
	color = '$borderColor',
}: {
	label: string
	value: string
	icon: string
	color?: ThemeTokens
}) {
	return (
		<XStack
			flex={1}
			minWidth={140}
			alignItems='center'
			gap='$2'
			padding='$2'
			backgroundColor='$backgroundFocus'
			borderRadius='$3'
		>
			<Icon name={icon} color={color} small />
			<YStack flex={1}>
				<SizableText size='$3' fontWeight='600' numberOfLines={1}>
					{value}
				</SizableText>
				<SizableText size='$1' color='$borderColor'>
					{label}
				</SizableText>
			</YStack>
		</XStack>
	)
}
