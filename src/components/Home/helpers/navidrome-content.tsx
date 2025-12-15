/**
 * Navidrome-specific Home content component.
 * Shows recent and frequent albums since Navidrome API provides these at album level.
 */

import React from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { H5, XStack, YStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useRecentAlbums, useFrequentAlbums, useNewestAlbums } from '../../../hooks/adapter'
import { ItemCard } from '../../Global/components/item-card'
import HorizontalCardList from '../../Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import HomeStackParamList from '../../../screens/Home/types'
import { UnifiedAlbum } from '../../../api/core/types'
import { unifiedAlbumsToBaseItems } from '../../../utils/unified-conversions'

function AlbumSection({
	title,
	albums,
	testIdPrefix,
}: {
	title: string
	albums: UnifiedAlbum[]
	testIdPrefix: string
}) {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const { horizontalItems } = useDisplayContext()

	if (!albums.length) return null

	// Convert to BaseItemDto for compatibility with existing components
	const baseItems = unifiedAlbumsToBaseItems(albums)

	return (
		<Animated.View
			entering={FadeIn.springify()}
			exiting={FadeOut.springify()}
			layout={LinearTransition.springify()}
			style={{ flex: 1 }}
		>
			<XStack alignItems='center'>
				<H5 marginLeft='$2'>{title}</H5>
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
						testId={`${testIdPrefix}-${index}`}
						item={album}
						onPress={() => {
							navigation.navigate('Album', { album })
						}}
						marginHorizontal='$1'
						captionAlign='left'
					/>
				)}
			/>
		</Animated.View>
	)
}

export default function NavidromeHomeContent(): React.JSX.Element {
	const { data: recentAlbums } = useRecentAlbums(15)
	const { data: frequentAlbums } = useFrequentAlbums(15)
	const { data: newestAlbums } = useNewestAlbums(15)

	return (
		<YStack gap='$3'>
			<AlbumSection
				title='Recently Played'
				albums={recentAlbums ?? []}
				testIdPrefix='recent-album'
			/>

			<AlbumSection
				title='On Repeat'
				albums={frequentAlbums ?? []}
				testIdPrefix='frequent-album'
			/>

			<AlbumSection
				title='Recently Added'
				albums={newestAlbums ?? []}
				testIdPrefix='newest-album'
			/>
		</YStack>
	)
}
