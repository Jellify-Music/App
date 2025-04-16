import Client from '../../api/client'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import React, { useEffect } from 'react'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'
import Albums from './albums'
import SimilarArtists from './similar'
import { Image } from 'expo-image'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { StackParamList } from '../types'
import { useArtistContext } from './provider'

const ArtistTabs = createMaterialTopTabNavigator<StackParamList>()

export default function ArtistNavigation(): React.JSX.Element {
	const { artist, scroll } = useArtistContext()

	const { width } = useSafeAreaFrame()

	const bannerHeight = 250

	const animatedBannerScroll = useSharedValue(bannerHeight)

	useEffect(() => {
		console.debug(scroll)

		if (scroll > 100) animatedBannerScroll.value = bannerHeight - scroll
		else animatedBannerScroll.value = bannerHeight

		console.debug(animatedBannerScroll.value)
	}, [scroll])

	return (
		<>
			<Animated.View>
				<Image
					source={getImageApi(Client.api!).getItemImageUrlById(artist.Id!)}
					style={{
						height: animatedBannerScroll.value,
						width: width,
					}}
				/>
			</Animated.View>
			<ArtistTabs.Navigator>
				<ArtistTabs.Screen
					name='ArtistAlbums'
					options={{
						title: 'Albums',
					}}
					component={Albums}
				/>

				<ArtistTabs.Screen
					name='ArtistEps'
					options={{
						title: 'Singles & EPs',
					}}
					component={Albums}
				/>
				<ArtistTabs.Screen
					name='SimilarArtists'
					options={{
						title: 'Similar',
					}}
					component={SimilarArtists}
				/>
			</ArtistTabs.Navigator>
		</>
	)
}
