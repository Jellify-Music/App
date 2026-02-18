import React from 'react'
import { Linking } from 'react-native'
import { YStack, XStack, SizableText, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Icon from '../../components/Global/components/icon'
import { Text } from '../../components/Global/helpers/text'
import usePatrons from '../../api/queries/patrons'
import { useInfoCaption } from '../../hooks/use-caption'
import { version } from '../../../package.json'
import { getStoredOtaVersion } from 'react-native-nitro-ota'
import { downloadUpdate } from '../../components/OtaUpdates'

function PatronsList({ patrons }: { patrons: { fullName: string }[] | undefined }) {
	if (!patrons?.length) return null
	return (
		<XStack flexWrap='wrap' gap='$2' marginTop='$2'>
			{patrons.map((patron, index) => (
				<XStack key={index} alignItems='flex-start' maxWidth='$20'>
					<Text numberOfLines={1} lineBreakStrategyIOS='standard'>
						{patron.fullName}
					</Text>
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
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<YStack gap='$1'>
						<XStack alignItems='center' gap='$2'>
							<Icon name='jellyfish' color='$primary' />
							<SizableText size='$6' fontWeight='bold'>
								Jellify {version}
							</SizableText>
						</XStack>
						{caption && (
							<SizableText size='$2' color='$borderColor'>
								{caption}
							</SizableText>
						)}
						{otaVersion && (
							<SizableText size='$2' color='$borderColor'>
								OTA Version: {otaVersion}
							</SizableText>
						)}
					</YStack>

					<XStack gap='$4' flexWrap='wrap'>
						<XStack
							alignItems='center'
							gap='$1'
							onPress={() => Linking.openURL('https://github.com/Jellify-Music/App')}
							pressStyle={{ opacity: 0.7 }}
						>
							<Icon name='code-tags' small color='$borderColor' />
							<Text>View Source</Text>
						</XStack>
						<XStack
							alignItems='center'
							gap='$1'
							onPress={() => downloadUpdate(true)}
							pressStyle={{ opacity: 0.7 }}
						>
							<Icon name='cellphone-arrow-down' small color='$borderColor' />
							<Text>Update</Text>
						</XStack>
					</XStack>

					<YStack gap='$2'>
						<SizableText size='$4' fontWeight='600'>
							Caught a bug?
						</SizableText>
						<XStack gap='$4' flexWrap='wrap'>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL('https://github.com/Jellify-Music/App/issues')
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='github' small color='$borderColor' />
								<Text>Report Issue</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() => Linking.openURL('https://discord.gg/yf8fBatktn')}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='chat' small color='$borderColor' />
								<Text>Join Discord</Text>
							</XStack>
						</XStack>
					</YStack>

					<YStack gap='$2'>
						<SizableText size='$4' fontWeight='600'>
							Wall of Fame
						</SizableText>
						<XStack gap='$4' flexWrap='wrap'>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL(
										'https://github.com/sponsors/anultravioletaurora/',
									)
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='github' small color='$borderColor' />
								<Text>Sponsors</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL('https://patreon.com/anultravioletaurora')
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='patreon' small color='$borderColor' />
								<Text>Patreon</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() => Linking.openURL('https://ko-fi.com/jellify')}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='coffee-outline' small color='$borderColor' />
								<Text>Ko-fi</Text>
							</XStack>
						</XStack>
						<PatronsList patrons={patrons} />
					</YStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
