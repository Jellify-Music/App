import TextTicker from 'react-native-text-ticker'
import { getToken, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { Text } from '../../Global/helpers/text'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, memo } from 'react'
import ItemImage from '../../Global/components/image'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import { useJellifyContext } from '../../../providers'
import FavoriteButton from '../../Global/components/favorite-button'
import { QueryKeys } from '../../../enums/query-keys'
import { PlayerParamList } from '../../../screens/Player/types'
import { useNowPlayingContext } from '../../../providers/Player'
import navigationRef from '../../../../navigation'
import Icon from '../../Global/components/icon'

interface SongInfoProps {
	navigation: NativeStackNavigationProp<PlayerParamList>
}

function SongInfo({ navigation }: SongInfoProps): React.JSX.Element {
	const { api } = useJellifyContext()
	const nowPlaying = useNowPlayingContext()

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
		enabled: !!nowPlaying?.item.AlbumId && !!api,
	})

	// Memoize expensive computations
	const trackTitle = useMemo(() => nowPlaying!.title ?? 'Untitled Track', [nowPlaying?.title])

	const artistName = useMemo(() => nowPlaying?.artist ?? 'Unknown Artist', [nowPlaying?.artist])

	const artistItems = useMemo(() => nowPlaying!.item.ArtistItems, [nowPlaying?.item.ArtistItems])

	// Memoize navigation handlers
	const handleAlbumPress = useCallback(() => {
		if (album) {
			navigation.goBack() // Dismiss player modal
			navigationRef.navigate('Tabs', {
				screen: 'LibraryTab',
				params: {
					screen: 'Album',
					params: {
						album,
					},
				},
			})
		}
	}, [album, navigation])

	const handleArtistPress = useCallback(() => {
		if (artistItems) {
			if (artistItems.length > 1) {
				navigation.navigate('MultipleArtistsSheet', {
					artists: artistItems,
				})
			} else {
				navigation.goBack() // Dismiss player modal
				navigationRef.navigate('Tabs', {
					screen: 'LibraryTab',
					params: {
						screen: 'Artist',
						params: {
							artist: artistItems[0],
						},
					},
				})
			}
		}
	}, [artistItems, navigation])

	return (
		<XStack flex={1}>
			<YStack marginHorizontal={'$1.5'} onPress={handleAlbumPress} justifyContent='center'>
				<ItemImage item={nowPlaying!.item} width={'$11'} height={'$11'} />
			</YStack>

			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker {...TextTickerConfig} style={{ height: getToken('$9') }}>
					<Text bold fontSize={'$6'}>
						{trackTitle}
					</Text>
				</TextTicker>

				<TextTicker {...TextTickerConfig} style={{ height: getToken('$8') }}>
					<Text fontSize={'$6'} color={'$color'} onPress={handleArtistPress}>
						{artistName}
					</Text>
				</TextTicker>
			</YStack>

			<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap={'$3'}>
				<Icon
					name='dots-horizontal-circle-outline'
					onPress={() => navigationRef.navigate('Context', { item: nowPlaying!.item })}
				/>

				<FavoriteButton item={nowPlaying!.item} />
			</XStack>
		</XStack>
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(SongInfo, (prevProps: SongInfoProps, nextProps: SongInfoProps) => {
	// Only re-render if navigation changes (which it shouldn't)
	return prevProps.navigation === nextProps.navigation
})
