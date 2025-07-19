import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { getTokens, useTheme, XStack, YStack } from 'tamagui'
import { H5 } from '../Global/helpers/text'
import FavoriteButton from '../Global/components/favorite-button'
import InstantMixButton from '../Global/components/instant-mix-button'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { useArtistContext } from '../../providers/Artist'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useJellifyContext } from '../../providers'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import React from 'react'
import Icon from '../Global/components/icon'
import { useQueueContext } from '../../providers/Player/queue'
import { usePlayerContext } from '../../providers/Player'
import { QueuingType } from '../../enums/queuing-type'
import { fetchAlbumDiscs } from '../../api/queries/item'

export default function ArtistTabBar(
	props: MaterialTopTabBarProps,
	stackNavigator: NativeStackNavigationProp<StackParamList>,
) {
	const { api } = useJellifyContext()
	const { artist, scroll, albums } = useArtistContext()
	const { useLoadNewQueue } = useQueueContext()
	const { useStartPlayback } = usePlayerContext()

	const { width } = useSafeAreaFrame()

	const theme = useTheme()

	const bannerHeight = getTokens().size['$16'].val

	const playArtist = async (shuffled: boolean = false) => {
		if (!albums || albums.length === 0) return

		try {
			// Get all tracks from all albums
			const albumTracksPromises = albums.map((album) => fetchAlbumDiscs(api, album))
			const albumDiscs = await Promise.all(albumTracksPromises)

			// Flatten all tracks from all albums
			const allTracks = albumDiscs.flatMap((discs) => discs.flatMap((disc) => disc.data))

			if (allTracks.length === 0) return

			useLoadNewQueue.mutate(
				{
					track: allTracks[0],
					index: 0,
					tracklist: allTracks,
					queue: artist,
					queuingType: QueuingType.FromSelection,
					shuffled,
				},
				{
					onSuccess: () => useStartPlayback.mutate(),
				},
			)
		} catch (error) {
			console.error('Failed to play artist tracks:', error)
		}
	}

	const animatedBannerStyle = useAnimatedStyle(() => {
		'worklet'
		const clampedScroll = Math.max(0, Math.min(scroll.value, bannerHeight))
		return {
			height: withSpring(bannerHeight - clampedScroll, {
				stiffness: 100,
				damping: 25,
			}),
		}
	})

	return (
		<>
			<Animated.View style={[animatedBannerStyle]}>
				<FastImage
					source={{
						uri: artist.Id
							? getImageApi(api!).getItemImageUrlById(artist.Id, ImageType.Backdrop)
							: '',
					}}
					style={{
						width: width,
						height: '100%',
						backgroundColor: theme.borderColor.val,
					}}
				/>
			</Animated.View>

			<YStack alignItems='center' marginHorizontal={'$2'} height={'$9'}>
				<XStack alignItems='center' justifyContent='center' flex={1}>
					<H5
						textAlign='center'
						numberOfLines={1}
						flex={1}
						lineBreakStrategyIOS='standard'
					>
						{artist.Name}
					</H5>
				</XStack>

				<XStack alignItems='center' justifyContent='center' flex={1}>
					<FavoriteButton item={artist} />

					<InstantMixButton item={artist} navigation={stackNavigator} />

					<Icon name='play' onPress={() => playArtist(false)} />

					<Icon name='shuffle' onPress={() => playArtist(true)} />
				</XStack>
			</YStack>
			<MaterialTopTabBar {...props} />
		</>
	)
}
