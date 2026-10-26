import React from 'react'
import { Linking } from 'react-native'
import { YStack, XStack, SizableText, ScrollView, Separator, Spacer } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import usePatrons from '../../api/queries/patrons'
import { useInfoCaption } from '../../hooks/use-caption'
import { version } from '../../../package.json'
import { getStoredOtaVersion } from 'react-native-nitro-ota'
import { downloadUpdate } from '../../services/ota'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import { SPECIAL_THANKS } from '../../configs/messaging/special-thanks'

function PatronsList({ patrons }: { patrons: { fullName: string }[] | undefined }) {
	if (!patrons?.length) return null
	return (
		<XStack flexWrap='wrap' gap='2' marginTop='2'>
			{patrons.map((patron, index) => (
				<XStack key={index} alignItems='flex-start' maxWidth='20'>
					<SizableText fontSize='2' numberOfLines={1} lineBreakStrategyIOS='standard'>
						{patron.fullName}
					</SizableText>
				</XStack>
			))}
		</XStack>
	)
}

function SpecialThanksList() {
	return (
		<XStack flexWrap='wrap' gap='2' marginTop='2'>
			{SPECIAL_THANKS.map((awesomePerson) => (
				<XStack key={awesomePerson} alignItems='flex-start' maxWidth='20'>
					<SizableText fontSize='2' numberOfLines={1} lineBreakStrategyIOS='standard'>
						{awesomePerson}
					</SizableText>
				</XStack>
			))}
		</XStack>
	)
}

export default function AboutScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const patrons = usePatrons()
	const { data: caption } = useInfoCaption()
	const otaVersion = getStoredOtaVersion()

	return (
		<YStack flex={1} backgroundColor='background' testID='settings-screen-about'>
			<ScrollView
				contentContainerStyle={{
					paddingBottom: Math.max(bottom, 16) + 16,
					paddingHorizontal: '2',
				}}
				showsVerticalScrollIndicator={false}
			>
				<YStack
					padding='4'
					gap='4'
					borderRadius='2'
					borderColor='borderColor'
					borderWidth='1'
				>
					<YStack gap='1'>
						<XStack alignItems='center' gap='2' testID='jellify-version-text'>
							<Icon name='jellyfish' color='primary' />
							<SizableText size='2' fontWeight='6'>
								Jellify {version}
							</SizableText>
						</XStack>
						{caption && (
							<SizableText size='1' color='borderColor'>
								{caption}
							</SizableText>
						)}
						{otaVersion && (
							<SizableText size='1' color='borderColor'>
								OTA Version: {otaVersion}
							</SizableText>
						)}
					</YStack>

					<Separator borderColor='borderColor' />

					<XStack gap='4' flexWrap='wrap'>
						<XStack
							alignItems='center'
							gap='1'
							{...ICON_PRESS_STYLES}
							onPress={() => Linking.openURL('https://github.com/Jellify-Music/App')}
							testID='jellify-source-link'
						>
							<Icon name='code-tags' size='7' color='borderColor' />
							<SizableText fontSize='2'>View Source</SizableText>
						</XStack>
						<XStack
							alignItems='center'
							gap='1'
							{...ICON_PRESS_STYLES}
							onPress={() => downloadUpdate(true)}
						>
							<Icon name='cellphone-arrow-down' size='7' color='success' />
							<SizableText fontSize='2'>Update</SizableText>
						</XStack>
					</XStack>

					<YStack gap='2'>
						<SizableText size='2' fontWeight='6'>
							Caught a bug?
						</SizableText>
						<XStack gap='4' flexWrap='wrap'>
							<XStack
								alignItems='center'
								gap='1'
								{...ICON_PRESS_STYLES}
								onPress={() =>
									Linking.openURL('https://github.com/Jellify-Music/App/issues')
								}
								testID='jellify-report-issue'
							>
								<Icon name='github' size='7' color='warning' />
								<SizableText fontSize='2'>Report Issue</SizableText>
							</XStack>
							<XStack
								alignItems='center'
								gap='1'
								{...ICON_PRESS_STYLES}
								onPress={() => Linking.openURL('https://discord.gg/yf8fBatktn')}
								testID='jellify-join-discord'
							>
								<Icon name='chat' size='7' color='secondary' />
								<SizableText fontSize='2'>Join Discord</SizableText>
							</XStack>
						</XStack>
					</YStack>
				</YStack>

				<Spacer />

				<YStack
					gap='2'
					padding='4'
					borderRadius='2'
					borderColor='borderColor'
					borderWidth='1'
					testID='jellify-wall-of-fame'
				>
					<SizableText size='2' fontWeight='6'>
						Wall of Fame
					</SizableText>
					<XStack gap='4' flexWrap='wrap'>
						<XStack
							alignItems='center'
							gap='1'
							{...ICON_PRESS_STYLES}
							onPress={() =>
								Linking.openURL('https://github.com/sponsors/anultravioletaurora/')
							}
							testID='jellify-sponsors-link'
						>
							<Icon name='github' size='7' color='primary' />
							<SizableText fontSize='2'>Sponsors</SizableText>
						</XStack>
						<XStack
							alignItems='center'
							gap='1'
							{...ICON_PRESS_STYLES}
							onPress={() =>
								Linking.openURL('https://patreon.com/anultravioletaurora')
							}
							testID='jellify-patreon-link'
						>
							<Icon name='patreon' size='7' color='danger' />
							<SizableText fontSize='2'>Patreon</SizableText>
						</XStack>
						<XStack
							alignItems='center'
							gap='1'
							{...ICON_PRESS_STYLES}
							onPress={() => Linking.openURL('https://ko-fi.com/jellify')}
							testID='jellify-ko-fi-link'
						>
							<Icon name='coffee-outline' size='7' color='warning' />
							<SizableText fontSize='2'>Ko-fi</SizableText>
						</XStack>
					</XStack>
					<PatronsList patrons={patrons} />
				</YStack>

				<Spacer />

				<YStack
					padding='4'
					gap='4'
					borderRadius='2'
					borderColor='borderColor'
					borderWidth='1'
				>
					<YStack gap='1'>
						<SizableText size='2' fontWeight='6'>
							Special Thanks
						</SizableText>
						<SpecialThanksList />
					</YStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
