import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import { getTokenValue, H5, XStack, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ActionPill from './action-pill'
import ItemImage from '../Global/components/image'
import { useArtistContext } from '../../providers/Artist'
import { InstantMixIconButton } from '../Global/components/instant-mix-button'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { getApi } from '../../stores/auth/utils'
import { AZ_SCROLLER_CLEARANCE } from '../Global/components/AZScroller'
import Icon from '../Global/components/icon'
import { loadNewQueue } from '../../player/queuing'
import { ImageUrlOptions } from '../../api/queries/image/utils'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'
import { useTranslation } from 'react-i18next'

export default function ArtistHeader(): React.JSX.Element {
	const { t } = useTranslation()

	const api = getApi()

	// the image runs up behind the status bar; the back and favourite pills sit on it (see the screen)
	const { top } = useSafeAreaInsets()

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
			handleError(error, LoggingContext.Queue, 'playArtist', {
				name: artist.Name ?? t('placeholders.unknownArtist'),
			})
		}
	}

	return (
		<YStack>
			<ItemImage
				item={artist}
				height={getTokenValue('14', 'size') + top}
				type={ImageType.Backdrop}
				cornered
				imageOptions={backdropImageOptions}
			/>

			{/* box-none: the space between the pills is still the image's, not theirs */}
			<XStack
				position='absolute'
				left='$2'
				right={AZ_SCROLLER_CLEARANCE}
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

			<YStack paddingHorizontal='2'>
				<H5 fontWeight='6'>{artist.Name}</H5>
			</YStack>
		</YStack>
	)
}

const backdropImageOptions: ImageUrlOptions = {
	maxWidth: 1440,
	maxHeight: 640,
}
