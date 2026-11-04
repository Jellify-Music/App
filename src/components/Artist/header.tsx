import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import { H5, XStack, YStack } from 'tamagui'
import ItemImage from '../Global/components/image'
import { useArtistContext } from '../../providers/Artist'
import FavoriteButton from '../Global/components/favorite-button'
import { InstantMixIconButton } from '../Global/components/instant-mix-button'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import IconButton from '../Global/utils/icon-button'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { getApi } from '../../stores/auth/utils'
import Icon from '../Global/components/icon'
import { loadNewQueue } from '../../player/queuing'
import { ImageUrlOptions } from '../../api/queries/image/utils'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'

export default function ArtistHeader(): React.JSX.Element {
	const api = getApi()

	const { artist, albums } = useArtistContext()

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

			await loadNewQueue({
				track: allTracks[0],
				index: 0,
				tracklist: allTracks,
				queue: artist,
				shuffled,
				startPlayback: true,
			})
		} catch (error) {
			handleError(error, LoggingContext.Queue, `Failed to play ${artist.Name ?? 'artist'}`)
		}
	}

	return (
		<YStack>
			<ItemImage
				item={artist}
				height={'14'}
				type={ImageType.Backdrop}
				cornered
				imageOptions={backdropImageOptions}
			/>

			<YStack paddingHorizontal='2'>
				<XStack alignItems='flex-end' justifyContent='flex-start'>
					<XStack alignItems='center' flex={1} justifyContent='space-between'>
						<H5 flexGrow={1} fontWeight={'6'}>
							{artist.Name}
						</H5>
					</XStack>
				</XStack>

				<XStack alignItems='center' justifyContent='space-between'>
					<XStack alignItems='center' gap='3' flex={1}>
						<FavoriteButton item={artist} />

						<InstantMixIconButton item={artist} navigation={navigation} />
					</XStack>

					<XStack alignItems='center' justifyContent='flex-end' gap='3' flex={1}>
						<Icon
							size='7'
							color='primary'
							name='shuffle'
							onPress={() => playArtist(true)}
						/>
						<IconButton circular name='play' onPress={() => playArtist(false)} />
					</XStack>
				</XStack>
			</YStack>
		</YStack>
	)
}

const backdropImageOptions: ImageUrlOptions = {
	maxWidth: 1440,
	maxHeight: 640,
}
