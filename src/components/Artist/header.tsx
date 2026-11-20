import { ImageType } from '@jellyfin/sdk/lib/generated-client'
import { getTokenValue, SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import { StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ActionPill from './action-pill'
import { transparentOf } from '../../utils/color'
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
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'
import { useTranslation } from 'react-i18next'

export default function ArtistHeader(): React.JSX.Element {
	const { t } = useTranslation()

	const api = getApi()

	// the image runs up behind the status bar; the back and favourite pills sit on it (see the screen)
	const { top } = useSafeAreaInsets()

	const theme = useTheme()
	const background = theme.background.val

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
			{/* The image runs down to where the tabs start; the name and buttons sit on its foot */}
			<ItemImage
				item={artist}
				height={getTokenValue('14', 'size') + top + NAME_ROW_HEIGHT}
				type={ImageType.Backdrop}
				cornered
				imageOptions={backdropImageOptions}
			/>

			{/* Fades the artwork into the page, so the name reads on any image */}
			<LinearGradient
				colors={[transparentOf(background), background]}
				style={styles.gradient}
				pointerEvents='none'
			/>

			{/* box-none: the space around the name and pill is still the image's, not theirs */}
			<XStack
				position='absolute'
				left='$2'
				right='$2'
				bottom='$2'
				alignItems='center'
				justifyContent='space-between'
				gap='$2'
				pointerEvents='box-none'
			>
				{/* flex, so the name has a width to be cut to */}
				<View flex={1}>
					<SizableText
						fontFamily='$heading'
						size='$7'
						fontWeight='6'
						numberOfLines={1}
						ellipsizeMode='tail'
					>
						{artist.Name}
					</SizableText>
				</View>

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

/** Room under the image's artwork for the name and the buttons that sit on its foot */
const NAME_ROW_HEIGHT = 72

const styles = StyleSheet.create({
	gradient: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: '60%',
	},
})

const backdropImageOptions: ImageUrlOptions = {
	maxWidth: 1440,
	maxHeight: 640,
}
