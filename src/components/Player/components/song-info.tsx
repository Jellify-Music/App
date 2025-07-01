import TextTicker from 'react-native-text-ticker'
import { getToken, getTokens, Spacer, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { usePlayerContext } from '../../../providers/Player'
import { Text } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import React, { useMemo } from 'react'
import ItemImage from '../../Global/components/image'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import { useJellifyContext } from '../../../providers'
import FavoriteButton from '../../Global/components/favorite-button'
import Icon from '../../Global/components/icon'

export default function SongInfo({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()

	const { data: album } = useQuery({
		queryKey: ['album', nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
	})

	return useMemo(() => {
		return (
			<XStack marginBottom={'$2'} flex={1}>
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
										album,
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
										screen: 'Library',
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

				<XStack justifyContent='flex-end' alignItems='center' flexShrink={1}>
					{/* Buttons for favorites, song menu go here */}

					<Icon
						name='dots-horizontal-circle-outline'
						onPress={() => {
							navigation.navigate('Details', {
								item: nowPlaying!.item,
								isNested: true,
							})
						}}
					/>

					<Spacer />

					<FavoriteButton item={nowPlaying!.item} />
				</XStack>
			</XStack>
		)
	}, [nowPlaying])
}
