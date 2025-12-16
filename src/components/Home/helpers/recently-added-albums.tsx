/**
 * Recently Added Albums section for Home screen.
 * Works for both Jellyfin and Navidrome using the unified adapter pattern.
 */

import React from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { H5, XStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useNewestAlbums } from '../../../hooks/adapter'
import { ItemCard } from '../../Global/components/item-card'
import HorizontalCardList from '../../Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import HomeStackParamList from '../../../screens/Home/types'
import { RootStackParamList } from '../../../screens/types'
import { unifiedAlbumsToBaseItems } from '../../../utils/unified-conversions'

export default function RecentlyAddedAlbums(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { horizontalItems } = useDisplayContext()

	const { data: newestAlbums } = useNewestAlbums(15)

	// Don't render if no data (Jellyfin may not support this query)
	if (!newestAlbums?.length) return <></>

	// Convert to BaseItemDto for compatibility with existing components
	const baseItems = unifiedAlbumsToBaseItems(newestAlbums)

	return (
		<Animated.View
			entering={FadeIn.springify()}
			exiting={FadeOut.springify()}
			layout={LinearTransition.springify()}
			style={{ flex: 1 }}
		>
			<XStack alignItems='center'>
				<H5 marginLeft='$2'>Recently Added</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={
					baseItems.length > horizontalItems
						? baseItems.slice(0, horizontalItems)
						: baseItems
				}
				renderItem={({ index, item: album }) => (
					<ItemCard
						size='$11'
						caption={album.Name}
						subCaption={album.AlbumArtist}
						squared
						testId={`recently-added-album-${index}`}
						item={album}
						onPress={() => {
							navigation.navigate('Album', { album })
						}}
						onLongPress={() => {
							rootNavigation.navigate('Context', {
								item: album,
								navigation,
							})
						}}
						marginHorizontal='$1'
						captionAlign='left'
					/>
				)}
			/>
		</Animated.View>
	)
}
