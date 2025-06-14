import { MaterialTopTabBar, MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { getTokens, useTheme, XStack } from 'tamagui'
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
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../types'
import React from 'react'

export default function ArtistTabBar(
	props: MaterialTopTabBarProps,
	stackNavigator: StackNavigationProp<StackParamList>,
) {
	const { api } = useJellifyContext()
	const { artist, scroll } = useArtistContext()

	const { width } = useSafeAreaFrame()

	const theme = useTheme()

	const bannerHeight = getTokens().size['$16'].val

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
						uri: getImageApi(api!).getItemImageUrlById(artist.Id!, ImageType.Backdrop),
					}}
					style={{
						width: width,
						height: '100%',
						backgroundColor: theme.borderColor.val,
					}}
				/>
			</Animated.View>

			<XStack
				marginHorizontal={'$4'}
				marginVertical={'$2'}
				alignContent='center'
				alignItems='center'
				justifyContent='space-between'
			>
				<H5 numberOfLines={2} maxWidth={width / 1.5}>
					{artist.Name}
				</H5>

				<XStack justifyContent='flex-end' gap={'$6'}>
					<FavoriteButton item={artist} />

					<InstantMixButton item={artist} navigation={stackNavigator} />
				</XStack>
			</XStack>
			<MaterialTopTabBar {...props} />
		</>
	)
}
