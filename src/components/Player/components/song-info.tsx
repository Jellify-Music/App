import TextTicker from 'react-native-text-ticker'
import { getToken, getTokens, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { usePlayerContext } from '../../../providers/Player'
import { Text } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'
import React, { useMemo } from 'react'
import ItemImage from '../../Global/components/image'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import { useJellifyContext } from '../../../providers'

export default function SongInfo(): React.JSX.Element {
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const navigation = useNavigation<StackNavigationProp<StackParamList>>()

	const { data: album } = useQuery({
		queryKey: ['album', nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
	})

	return useMemo(() => {
		return (
			<XStack marginBottom={'$2'}>
				<YStack
					marginRight={'$2'}
					onPress={() => {
						if (album) {
							navigation.goBack() // Dismiss player modal
							navigation.navigate('Tabs', {
								screen: 'Library',
								params: {
									screen: 'Album',
									params: {
										album: album!,
									},
								},
							})
						}
					}}
				>
					<ItemImage item={nowPlaying!.item} width={'$12'} height={'$12'} />
				</YStack>

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
			</XStack>
		)
	}, [nowPlaying])
}
