import TextTicker from 'react-native-text-ticker'
import { getToken, getTokens, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { usePlayerContext } from '../../../providers/Player'
import { Text } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'

export default function SongInfo(): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()
	const navigation = useNavigation<StackNavigationProp<StackParamList>>()

	return (
		<YStack justifyContent='flex-start' flex={5}>
			<TextTicker {...TextTickerConfig}>
				<Text bold fontSize={'$6'}>
					{nowPlaying!.title ?? 'Untitled Track'}
				</Text>
			</TextTicker>

			<TextTicker {...TextTickerConfig}>
				<Text
					fontSize={'$6'}
					color={'$color'}
					onPress={() => {
						if (nowPlaying!.item.ArtistItems) {
							navigation.goBack() // Dismiss player modal
							navigation.navigate('Tabs', {
								screen: 'Home',
								params: {
									screen: 'Artist',
									params: {
										artist: nowPlaying!.item.ArtistItems![0],
									},
								},
							})
						}
					}}
				>
					{nowPlaying?.artist ?? 'Unknown Artist'}
				</Text>
			</TextTicker>

			{/* <TextTicker {...TextTickerConfig}>
                <Text fontSize={'$6'} color={'$borderColor'}>
                    {nowPlaying?.album ?? ''}
                </Text>
            </TextTicker> */}
		</YStack>
	)
}
