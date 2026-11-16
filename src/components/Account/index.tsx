import React from 'react'
import { YStack, XStack, SizableText, ScrollView, Avatar, Card } from 'tamagui'
import { useJellyfinServer } from '../../hooks/auth/server'
import { usePublicServerInfo } from '../../api/queries/public-server-info'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../Global/components/icon'
import Button from '../Global/utils/button'
import SettingsSection from '../Settings/components/settings-section'
import { SettingsStackParamList } from '../../screens/Settings/types'
import { useJellifyUser, useJellifyLibrary } from '../../stores/auth'
import HTTPS from '../../constants/protocols'
import getUserImageUrl from '../../api/queries/image/utils/avatar'
import ServerInfoChip from './components/chip'
import { useTranslation } from 'react-i18next'

export default function Account(): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [server] = useJellyfinServer()
	const { data: serverInfo } = usePublicServerInfo()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const isSecure = server?.url?.includes(HTTPS)

	const userAvatarUrl = getUserImageUrl()

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<YStack testID='settings-screen-account'>
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
								{user?.name ?? t('placeholders.unknownUser')}
							</SizableText>
							<SizableText fontSize='2' color='background'>
								{t('account.jellyfinUser')}
							</SizableText>
						</YStack>
					</YStack>
				</Card>

				{/* Library Section */}
				<SettingsSection
					title={t('account.musicLibrary')}
					icon='book-music'
					iconColor='primary'
					defaultExpanded
					collapsible={false}
				>
					<XStack
						alignItems='center'
						justifyContent='space-between'
						padding='2'
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
									{library
										? (library.musicLibraryName ??
											t('placeholders.unknownLibrary'))
										: t('account.allLibraries')}
								</SizableText>
								<SizableText fontSize='2' color='borderColor'>
									{t('account.currentLibrary')}
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
							<SizableText fontSize='2'>{t('common.change')}</SizableText>
						</Button>
					</XStack>
				</SettingsSection>

				{/* Server Section */}
				<SettingsSection
					title={t('account.server')}
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
									{serverInfo?.ServerName ?? t('placeholders.unknownServer')}
								</SizableText>
								<SizableText fontSize='2' color='borderColor'>
									{server?.url ?? t('placeholders.unknownAddress')}
								</SizableText>
							</YStack>
						</XStack>

						<XStack flexWrap='wrap' gap='2'>
							<ServerInfoChip
								label={t('account.version')}
								value={serverInfo?.Version ?? t('common.unknown')}
								icon='information'
							/>
							<ServerInfoChip
								label={t('account.connection')}
								value={isSecure ? t('account.secure') : t('account.insecure')}
								icon={isSecure ? 'shield-check' : 'shield-alert'}
								color={isSecure ? 'success' : 'warning'}
							/>
						</XStack>
					</YStack>
				</SettingsSection>
			</YStack>
		</ScrollView>
	)
}
