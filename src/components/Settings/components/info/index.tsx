import { SafeAreaView } from 'react-native-safe-area-context'
import { version } from '../../../../../package.json'
import { H5, Text } from '../../../Global/helpers/text'
import SettingsListGroup from '../settings-list-group'
import { InfoTabNativeStackNavigationProp } from './types'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../../enums/query-keys'
import { useJellifyContext } from '../../../../providers'
import fetchPatrons from '../../../../api/queries/patrons'
import { FlatList, Linking } from 'react-native'
import { H6, ScrollView, Separator, XStack, YStack } from 'tamagui'
import Icon from '../../../Global/components/icon'
import { useEffect, useState } from 'react'
import { useSettingsContext } from '../../../../providers/Settings'
export default function InfoTabIndex({ navigation }: InfoTabNativeStackNavigationProp) {
	const { api } = useJellifyContext()

	const { setDevTools } = useSettingsContext()

	const [versionNumberPresses, setVersionNumberPresses] = useState(0)

	const { data: patrons } = useQuery({
		queryKey: [QueryKeys.Patrons],
		queryFn: () => fetchPatrons(api),
	})

	useEffect(() => {
		if (versionNumberPresses > 5) {
			setDevTools(true)
		}
	}, [versionNumberPresses])

	return (
		<ScrollView contentInsetAdjustmentBehavior='automatic'>
			<SettingsListGroup
				settingsList={[
					{
						title: `Jellify`,
						subTitle: version,
						iconName: 'jellyfish',
						iconColor: '$secondary',
						children: (
							<YStack gap={'$2'}>
								<Text
									onPress={() =>
										setVersionNumberPresses(versionNumberPresses + 1)
									}
								>
									Made with 💜 by Violet Caulfield
								</Text>

								<Separator marginBottom={'$2'} />
								<XStack gap={'$3'}>
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
										onPress={() =>
											Linking.openURL('https://discord.gg/yf8fBatktn')
										}
									>
										<Icon name='discord' small color='$borderColor' />
										<Text>Join Discord</Text>
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
							</XStack>
						),
					},
					{
						title: 'Powered by listeners like you',
						subTitle: 'Sponsor Jellify on GitHub or Patreon',
						iconName: 'heart',
						iconColor: '$primary',
						children: (
							<FlatList
								data={patrons}
								ListHeaderComponent={
									<YStack>
										<XStack
											justifyContent='flex-start'
											gap={'$4'}
											marginVertical={'$2'}
										>
											<XStack
												alignItems='center'
												gap={'$2'}
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
												gap={'$2'}
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

										<Separator marginBottom={'$3'} />

										<Text fontSize={'$5'}>Patreon Wall of Fame</Text>
									</YStack>
								}
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
