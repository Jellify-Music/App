import React from 'react'
import { StatusBar, StyleSheet } from 'react-native'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useTheme, XStack } from 'tamagui'
import { useArtistContext } from '../../providers/Artist'
import { BaseStackParamList } from '../../screens/types'
import { getBlurhashFromDto } from '../../utils/parsing/blurhash'
import {
	blurhashLuminance,
	LUMINANCE_CONTRAST_MIDPOINT,
} from '../../utils/parsing/blurhash-luminance'
import FavoriteButton from '../Global/components/favorite-button'
import Icon from '../Global/components/icon'
import ActionPill from './action-pill'
import ArtistDownloadButton from './download-button'
import { useArtistCollapsed, useArtistScrollY, useArtistTopBar } from './scroll'

/**
 * Back, download and favourite, over the artist's image. Once the image has scrolled away they are
 * over the lists instead, so the bar behind them fades in solid, and the status bar goes back to
 * the app's own style rather than the one that suited the artwork.
 */
export default function ArtistTopBar(): React.JSX.Element {
	const { artist } = useArtistContext()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const theme = useTheme()

	const { height, statusBarHeight, fadeFrom, fadeTo } = useArtistTopBar()

	const scrollY = useArtistScrollY()
	const collapsed = useArtistCollapsed()

	const isFocused = useIsFocused()

	const backgroundStyle = useAnimatedStyle(() => ({
		opacity: interpolate(scrollY.get(), [fadeFrom, fadeTo], [0, 1], 'clamp'),
	}))

	// While the image is under the status bar, its icons follow how bright the image is up there,
	// rather than the app's theme. Without a blurhash to go by, the app's own style stands.
	const luminance = blurhashLuminance(
		// the header shows the artist's backdrop, or else their primary image: read the one on show
		getBlurhashFromDto(artist, ImageType.Backdrop) ||
			getBlurhashFromDto(artist, ImageType.Primary),
	)
	const statusBarStyle =
		collapsed || luminance === undefined
			? undefined
			: luminance > LUMINANCE_CONTRAST_MIDPOINT
				? 'dark-content'
				: 'light-content'

	return (
		<>
			{isFocused && statusBarStyle ? <StatusBar barStyle={statusBarStyle} /> : null}

			<Animated.View
				pointerEvents='none'
				style={[
					styles.background,
					{ height, backgroundColor: theme.background.val },
					backgroundStyle,
				]}
			/>

			{/* box-none: the space between the pills is still the image's, not theirs */}
			<XStack
				position='absolute'
				top={statusBarHeight + 8}
				left='$2'
				right='$2'
				justifyContent='space-between'
				pointerEvents='box-none'
			>
				<ActionPill circular>
					<Icon
						name='chevron-left'
						size='7'
						color='primary'
						onPress={() => navigation.goBack()}
						testID='artist-back-button'
					/>
				</ActionPill>

				<ActionPill>
					<ArtistDownloadButton />

					<FavoriteButton item={artist} />
				</ActionPill>
			</XStack>
		</>
	)
}

const styles = StyleSheet.create({
	background: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
	},
})
