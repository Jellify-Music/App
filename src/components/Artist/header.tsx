import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import { XStack, YStack } from 'tamagui'
import ItemImage from '../Global/components/image'
import { useArtistContext } from '../../providers/Artist'
import { InstantMixIconButton } from '../Global/components/instant-mix-button'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { getApi } from '../../stores/auth/utils'
import Icon from '../Global/components/icon'
import { loadNewQueue } from '../../player/queuing'
import { ImageUrlOptions } from '../../api/queries/image/utils'

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
			console.error('Failed to play artist tracks:', error)
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

			{/* box-none: the space between the pills is still the image's, not theirs */}
			<XStack
				position='absolute'
				left='$2'
				right='$2'
				bottom='$2'
				alignItems='center'
				justifyContent='flex-end'
				pointerEvents='box-none'
			>
				<ActionPill>
					<Icon
						size='7'
						color='primary'
						name='shuffle'
						onPress={() => playArtist(true)}
					/>

					<InstantMixIconButton item={artist} navigation={navigation} />

					<Icon
						size='7'
						color='primary'
						name='play-circle-outline'
						onPress={() => playArtist(false)}
					/>
				</ActionPill>
			</XStack>
		</YStack>
	)
}

/** A group of buttons on the artist's image, on a background that keeps them readable on any artwork */
function ActionPill({ children }: { children: React.ReactNode }): React.JSX.Element {
	return (
		<XStack
			alignItems='center'
			gap='3'
			paddingHorizontal='3'
			paddingVertical='1'
			borderRadius={999}
			backgroundColor='$darkBackground'
		>
			{children}
		</XStack>
	)
}

const backdropImageOptions: ImageUrlOptions = {
	maxWidth: 1440,
	maxHeight: 640,
}
