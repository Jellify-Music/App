import React, { useEffect, useRef, useState } from 'react'
import { ItemCard } from '../Global/components/item-card'
import { ArtistAlbumsProps, ArtistEpsProps, ArtistFeaturedOnProps } from './types'
import { Text } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import { convertRunTimeTicksToSeconds } from '../../utils/runtimeticks'
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated'
import { ActivityIndicator, ViewToken } from 'react-native'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { getToken } from 'tamagui'
import navigationRef from '../../../navigation'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { warmItemContext } from '../../hooks/use-item-context'
import { useJellifyContext } from '../../providers'
import useStreamingDeviceProfile from '../../stores/device-profile'
export default function Albums({
	route,
	navigation,
}: ArtistAlbumsProps | ArtistEpsProps | ArtistFeaturedOnProps): React.JSX.Element {
	const { api, user } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	const { width } = useSafeAreaFrame()
	const { albums, fetchingAlbums, featuredOn, scroll } = useArtistContext()
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			'worklet'
			scroll.value = event.contentOffset.y
		},
	})

	const onViewableItemsChangedRef = useRef(
		({ viewableItems }: { viewableItems: ViewToken<BaseItemDto>[] }) => {
			viewableItems.forEach(({ isViewable, item }) => {
				if (isViewable) warmItemContext(api, user, item, deviceProfile)
			})
		},
	)

	const [columns, setColumns] = useState(Math.floor(width / getToken('$20')))

	useEffect(() => {
		setColumns(Math.floor(width / getToken('$20')))
	}, [width])

	return (
		<Animated.FlatList
			contentContainerStyle={{
				flexGrow: 1,
				justifyContent: 'flex-start',
				alignSelf: 'center',
			}}
			data={
				route.name === 'ArtistFeaturedOn' && featuredOn
					? featuredOn
					: albums
						? albums.filter(
								(album) =>
									/**
									 * If we're displaying albums, limit the album array
									 * to those that have at least 6 songs or a runtime longer
									 * than 28 minutes
									 *
									 * We have this set to 28 minutes because 30 minutes is the
									 * physical limitation of an EP record, but digital albums tend to
									 * fall in the 28 minute range
									 */
									(route.name === 'ArtistAlbums' &&
										((album.ChildCount && album.ChildCount >= 6) ||
											convertRunTimeTicksToSeconds(album.RunTimeTicks ?? 0) /
												60 >
												28)) ||
									(route.name === 'ArtistEps' &&
										((album.ChildCount && album.ChildCount < 6) ||
											convertRunTimeTicksToSeconds(album.RunTimeTicks ?? 0) /
												60 <=
												28)),
							)
						: []
			}
			key={`${route.name}-${columns}`}
			keyExtractor={(item) => `${item.Id}-${item.Name}-${columns}`}
			numColumns={columns}
			renderItem={({ item: album }) => (
				<ItemCard
					caption={album.Name}
					subCaption={album.ProductionYear?.toString()}
					size={'$14'}
					squared
					item={album}
					onPress={() => {
						navigation.navigate('Album', {
							album,
						})
					}}
					onLongPress={() => {
						navigationRef.navigate('Context', {
							item: album,
							navigation,
						})
					}}
				/>
			)}
			onScroll={scrollHandler}
			ListEmptyComponent={
				fetchingAlbums ? (
					<ActivityIndicator />
				) : (
					<Text textAlign='center' justifyContent='center'>
						No albums
					</Text>
				)
			}
			removeClippedSubviews
			onViewableItemsChanged={onViewableItemsChangedRef.current}
		/>
	)
}
