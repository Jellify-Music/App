import TextTicker from 'react-native-text-ticker'
import { getToken, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { Text } from '../../Global/helpers/text'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ItemImage from '../../Global/components/image'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import { useJellifyContext } from '../../../providers'
import FavoriteButton from '../../Global/components/favorite-button'
import { QueryKeys } from '../../../enums/query-keys'
import { useNowPlaying } from '../../../providers/Player/hooks/queries'
import navigationRef from '../../../../navigation'
import Icon from '../../Global/components/icon'
import { getItemName } from '../../../utils/text'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LyricDto } from '@jellyfin/sdk/lib/generated-client/models'
import { fetchRawLyrics } from '../../../api/queries/lyrics'
import { PlayerParamList } from '../../../screens/Player/types'

export default function SongInfo(): React.JSX.Element {
	const { api } = useJellifyContext()
	const { data: nowPlaying } = useNowPlaying()

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
		enabled: !!nowPlaying?.item.AlbumId && !!api,
	})

	const [lyrics, setLyrics] = useState<LyricDto['Lyrics'] | undefined>(undefined)

	// Memoize expensive computations
	const trackTitle = useMemo(() => nowPlaying!.title ?? 'Untitled Track', [nowPlaying?.title])

	const { artistItems, artists } = useMemo(() => {
		return {
			artistItems: nowPlaying!.item.ArtistItems,
			artists: nowPlaying!.item.ArtistItems?.map((artist) => getItemName(artist)).join(' • '),
		}
	}, [nowPlaying?.item.ArtistItems])

	// Memoize navigation handlers
	const handleAlbumPress = useCallback(() => {
		if (album) {
			navigationRef.goBack() // Dismiss player modal
			navigationRef.dispatch(CommonActions.navigate('Album', { album }))
		}
	}, [album])

	const handleArtistPress = useCallback(() => {
		if (artistItems) {
			if (artistItems.length > 1) {
				navigationRef.dispatch(
					CommonActions.navigate('MultipleArtistsSheet', {
						artists: artistItems,
					}),
				)
			} else {
				navigationRef.goBack() // Dismiss player modal
				navigationRef.dispatch(CommonActions.navigate('Artist', { artist: artistItems[0] }))
			}
		}
	}, [artistItems])

	useEffect(() => {
		if (api) {
			fetchRawLyrics(api, nowPlaying?.item?.Id ?? '')
				.then((lyrics) => {
					setLyrics(lyrics)
				})
				.catch((error) => {
					console.error('Error fetching lyrics', error)
				})
		}
	}, [api, nowPlaying])

	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	return (
		<XStack>
			<YStack marginRight={'$2.5'} onPress={handleAlbumPress} justifyContent='center'>
				<ItemImage item={nowPlaying!.item} width={'$12'} height={'$12'} />
			</YStack>

			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker {...TextTickerConfig} style={{ height: getToken('$9') }}>
					<Text bold fontSize={'$6'}>
						{trackTitle}
					</Text>
				</TextTicker>

				<TextTicker {...TextTickerConfig} style={{ height: getToken('$8') }}>
					<Text fontSize={'$6'} color={'$color'} onPress={handleArtistPress}>
						{artists ?? 'Unknown Artist'}
					</Text>
				</TextTicker>
			</YStack>

			<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap={'$3'}>
				{lyrics && (
					<Icon
						name='music-note-outline'
						onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
					/>
				)}
				<Icon
					name='dots-horizontal-circle-outline'
					onPress={() => navigationRef.navigate('Context', { item: nowPlaying!.item })}
				/>

				<FavoriteButton item={nowPlaying!.item} />
			</XStack>
		</XStack>
	)
}
