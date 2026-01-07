import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import { Text, XStack, YStack } from 'tamagui'
import ItemImage from '../Global/components/image'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { H5 } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import FavoriteButton from '../Global/components/favorite-button'
import { InstantMixIconButton } from '../Global/components/instant-mix-button'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import IconButton from '../Global/helpers/icon-button'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'
import { QueuingType } from '../../enums/queuing-type'
import { getApi } from '../../stores'
import Icon from '../Global/components/icon'
import useTracks from '../../api/queries/track'

export default function ArtistHeader(): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const api = getApi()

	const { artist, albums } = useArtistContext()

	const loadNewQueue = useLoadNewQueue()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const playArtist = async (shuffled: boolean = false) => {
		if (!albums || albums.length === 0) return

		try {
			// Get all tracks from all albums
			const albumTracksPromises = albums.map((album) => fetchAlbumDiscs(api, album))
			const albumDiscs = await Promise.all(albumTracksPromises)

			// Flatten all tracks from all albums
			const allTracks = albumDiscs.flatMap((discs) => discs.flatMap((disc) => disc.data))

			if (allTracks.length === 0) return

			loadNewQueue({
				track: allTracks[0],
				index: 0,
				tracklist: allTracks,
				queue: artist,
				queuingType: QueuingType.FromSelection,
				shuffled,
				startPlayback: true,
			})
		} catch (error) {
			console.error('Failed to play artist tracks:', error)
		}
	}

	const [trackPageParams, tracksInfiniteQuery] = useTracks(artist.Id)

	return (
		<YStack flex={1}>
			<ItemImage
				item={artist}
				width={width}
				height={'$20'}
				type={ImageType.Backdrop}
				cornered
				imageOptions={{ maxWidth: width * 2, maxHeight: 640 }}
			/>

			<YStack paddingHorizontal={'$2'}>
				<XStack alignItems='flex-end' justifyContent='flex-start' flex={1}>
					<XStack alignItems='center' flex={1} justifyContent='space-between'>
						<H5 flexGrow={1} fontWeight={'bold'}>
							{artist.Name}
						</H5>
					</XStack>
				</XStack>

				<XStack alignItems='center' justifyContent='space-between' flex={1}>
					<XStack alignItems='center' gap={'$3'} flex={1}>
						<FavoriteButton item={artist} />

						<InstantMixIconButton item={artist} navigation={navigation} />
					</XStack>

					<XStack alignItems='center' justifyContent='flex-end' gap={'$3'} flex={1}>
						<Icon
							small
							color='$primary'
							name='shuffle'
							onPress={() => playArtist(true)}
						/>
						<IconButton circular name='play' onPress={() => playArtist(false)} />
					</XStack>
				</XStack>

				<XStack
					alignItems='center'
					flex={1}
					justifyContent='flex-start'
					marginVertical={'$2'}
					onPress={() =>
						navigation.push('Tracks', {
							tracksInfiniteQuery,
						})
					}
				>
					<Text fontWeight={'bold'} fontSize={'$4'}>{`View Tracks`}</Text>

					<Icon name='chevron-right' small />
				</XStack>
			</YStack>
		</YStack>
	)
}
