import TextTicker from 'react-native-text-ticker'
import { getToken, getTokens, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { usePlayerContext } from '../../../providers/Player'
import { Text } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'
import React, { useMemo } from 'react'

export default function SongInfo(): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()
	const navigation = useNavigation<StackNavigationProp<StackParamList>>()

	return useMemo(() => {
		return (
			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker {...TextTickerConfig} style={{ height: getToken('$9') }}>
					<Text bold fontSize={'$7'}>
						{nowPlaying!.title ?? 'Untitled Track'}
					</Text>
				</TextTicker>

				<TextTicker {...TextTickerConfig} style={{ height: getToken('$9') }}>
					<Text
						fontSize={'$7'}
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
			</YStack>
		)
	}, [nowPlaying])
}
