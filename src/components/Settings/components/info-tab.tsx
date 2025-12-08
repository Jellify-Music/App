import { version } from '../../../../package.json'
import { Text } from '../../Global/helpers/text'
import SettingsListGroup from './settings-list-group'
import { Linking } from 'react-native'
import { ScrollView, XStack, YStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import usePatrons from '../../../api/queries/patrons'
import { useQuery } from '@tanstack/react-query'
import { INFO_CAPTIONS } from '../../../configs/info.config'
import { ONE_HOUR } from '../../../constants/query-client'
import { pickRandomItemFromArray } from '../../../utils/random'
import { getStoredOtaVersion } from 'react-native-nitro-ota'
import { downloadUpdate } from '../../OtaUpdates'

function PatronsList({ patrons }: { patrons: { fullName: string }[] | undefined }) {
	if (!patrons?.length) return null

	return (
		<XStack flexWrap='wrap' gap='$2' marginTop='$2'>
			{patrons.map((patron, index) => (
				<XStack key={index} alignItems='flex-start' maxWidth={'$20'}>
					<Text numberOfLines={1} lineBreakStrategyIOS='standard'>
						{patron.fullName}
					</Text>
				</XStack>
			))}
		</XStack>
	)
}

export default function InfoTab() {
	const patrons = usePatrons()

	const { data: caption } = useQuery({
		queryKey: ['Info_Caption'],
		queryFn: () => `${pickRandomItemFromArray(INFO_CAPTIONS)}`,
		staleTime: ONE_HOUR,
		initialData: 'Live and in stereo',
		refetchOnMount: 'always',
		refetchOnWindowFocus: 'always',
	})
	const otaVersion = getStoredOtaVersion()
	const otaVersionText = otaVersion ? `OTA Version: ${otaVersion}` : ''
	return (
		<ScrollView contentInsetAdjustmentBehavior='automatic'>
			<SettingsListGroup
				settingsList={[
					{
						title: `Jellify ${version}`,
						subTitle: caption,
						iconName: 'jellyfish',
						iconColor: '$primary',
						children: (
							<YStack>
								{otaVersionText && (
									<XStack gap={'$3'} marginTop={'$2'}>
										<Text color='$borderColor'>{otaVersionText}</Text>
									</XStack>
								)}

								<XStack gap={'$3'} marginTop={'$2'}>
									<XStack
										alignItems='center'
										onPress={() =>
											Linking.openURL('https://github.com/Jellify-Music/App')
										}
									>
										<Icon name='code-tags' small color='$borderColor' />
										<Text>View Source</Text>
									</XStack>
									<XStack
										alignItems='center'
										onPress={() => downloadUpdate(true)}
									>
										<Icon
											name='cellphone-arrow-down'
											small
											color='$borderColor'
										/>
										<Text>Update</Text>
									</XStack>
								</XStack>
							</YStack>
						),
					},
					{
						title: 'Caught a bug?',
						subTitle: "Let's squash it!",
						iconName: 'bug',
						iconColor: '$danger',
						children: (
							<XStack gap={'$3'} marginTop={'$2'}>
								<XStack
									alignItems='center'
									onPress={() =>
										Linking.openURL(
											'https://github.com/Jellify-Music/App/issues',
										)
									}
								>
									<Icon name='github' small color='$borderColor' />
									<Text>Report Issue</Text>
								</XStack>
								<XStack
									alignItems='center'
									onPress={() => Linking.openURL('https://discord.gg/yf8fBatktn')}
								>
									<Icon name='chat' small color='$borderColor' />
									<Text>Join Discord</Text>
								</XStack>
							</XStack>
						),
					},
					{
						title: 'Wall of Fame',
						subTitle: 'Sponsor on GitHub or Patreon',
						iconName: 'hand-heart',
						iconColor: '$secondary',
						children: (
							<YStack>
								<XStack
									justifyContent='flex-start'
									gap={'$4'}
									marginVertical={'$2'}
								>
									<XStack
										alignItems='center'
										onPress={() =>
											Linking.openURL(
												'https://github.com/sponsors/anultravioletaurora/',
											)
										}
									>
										<Icon name='github' small color='$borderColor' />
										<Text>Sponsors</Text>
									</XStack>
									<XStack
										alignItems='center'
										onPress={() =>
											Linking.openURL(
												'https://patreon.com/anultravioletaurora',
											)
										}
									>
										<Icon name='patreon' small color='$borderColor' />
										<Text>Patreon</Text>
									</XStack>
								</XStack>
								<PatronsList patrons={patrons} />
							</YStack>
						),
					},
				]}
			/>
		</ScrollView>
	)
}
