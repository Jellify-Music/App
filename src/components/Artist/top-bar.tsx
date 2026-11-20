import React, { useState } from 'react'
import { StatusBar, StyleSheet } from 'react-native'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useTheme, XStack } from 'tamagui'
import { useArtistContext } from '../../providers/Artist'
import useIsLightMode from '../../hooks/use-is-light-mode'
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
import ArtistDownloadsPanel from './downloads-panel'
import { useArtistDownload } from '../../hooks/downloads/artist'
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

	const isLightMode = useIsLightMode()

	const download = useArtistDownload()

	// which albums are downloading, shown on request, and only while something is
	const [showingDownloads, setShowingDownloads] = useState(false)

	const backgroundStyle = useAnimatedStyle(() => ({
		opacity: interpolate(scrollY.get(), [fadeFrom, fadeTo], [0, 1], 'clamp'),
	}))

	// While the image is under the status bar, its icons follow how bright the image is up there.
	// Once the bar is solid, they follow the theme, which the status bar does not do by itself.
	const luminance = blurhashLuminance(
		// the header shows the artist's backdrop, or else their primary image: read the one on show
		getBlurhashFromDto(artist, ImageType.Backdrop) ||
			getBlurhashFromDto(artist, ImageType.Primary),
	)
	const themeStyle = isLightMode ? 'dark-content' : 'light-content'
	const statusBarStyle = collapsed
		? themeStyle
		: luminance === undefined
			? themeStyle
			: luminance > LUMINANCE_CONTRAST_MIDPOINT
				? 'dark-content'
				: 'light-content'

	return (
		<>
			{isFocused ? <StatusBar barStyle={statusBarStyle} /> : null}

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
					<ArtistDownloadButton
						download={download}
						onShowProgress={() => setShowingDownloads((showing) => !showing)}
					/>

					<FavoriteButton item={artist} />
				</ActionPill>
			</XStack>

			{showingDownloads && download.state === 'downloading' ? (
				<ArtistDownloadsPanel trackIds={download.trackIds} top={height + 4} />
			) : null}
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
