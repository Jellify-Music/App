import { version } from '../../../../../package.json'
import { Text } from '../../../Global/helpers/text'
import SettingsListGroup from '../settings-list-group'
import { FlatList, Linking } from 'react-native'
import { ScrollView, Separator, XStack, YStack } from 'tamagui'
import Icon from '../../../Global/components/icon'
import usePatrons from '../../../../api/queries/patrons'
import { useQuery } from '@tanstack/react-query'
import INFO_CAPTIONS from '../../utils/info-caption'
import { ONE_HOUR } from '../../../../constants/query-client'
import { pickRandomItemFromArray } from '../../../../utils/random'
import { FlashList } from '@shopify/flash-list'

export default function InfoTabIndex() {
	const patrons = usePatrons()

	const { data: caption } = useQuery({
		queryKey: ['Info_Caption'],
		queryFn: () => `${pickRandomItemFromArray(INFO_CAPTIONS)}`,
		staleTime: ONE_HOUR,
		initialData: 'Live and in stereo',
	})

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
									onPress={() => Linking.openURL('https://discord.gg/yf8fBatktn')}
								>
									<Icon name='chat' small color='$borderColor' />
									<Text>Join Discord</Text>
								</XStack>
							</XStack>
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
							</XStack>
						),
					},
					{
						title: 'Powered by listeners like you',
						subTitle: 'Sponsor on GitHub or Patreon',
						iconName: 'heart',
						iconColor: '$secondary',
						children: (
							<XStack justifyContent='flex-start' gap={'$4'} marginVertical={'$2'}>
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
										Linking.openURL('https://patreon.com/anultravioletaurora')
									}
								>
									<Icon name='patreon' small color='$borderColor' />
									<Text>Patreon</Text>
								</XStack>
							</XStack>
						),
					},
					{
						title: 'Patreon Wall of Fame',
						subTitle: 'Thank you to these paid members',
						iconName: 'patreon',
						iconColor: '$secondary',
						children: (
							<FlashList
								data={patrons}
								numColumns={1}
								renderItem={({ item }) => (
									<XStack alignItems='flex-start' maxWidth={'$20'}>
										<Text numberOfLines={1} lineBreakStrategyIOS='standard'>
											{item.fullName}
										</Text>
									</XStack>
								)}
							/>
						),
					},
				]}
			/>
		</ScrollView>
	)
}
