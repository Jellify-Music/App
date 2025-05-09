import { Separator, XStack } from 'tamagui'
import Track from '../Global/components/track'
import Icon from '../Global/helpers/icon'
import { trigger } from 'react-native-haptic-feedback'
import { RefreshControl } from 'react-native'
import { PlaylistProps } from './interfaces'
import PlayliistTracklistHeader from './components/header'
import { usePlaylistContext } from '../../providers/Playlist'
import { useAnimatedScrollHandler } from 'react-native-reanimated'
import AnimatedDraggableFlatList from '../Global/components/animated-draggable-flat-list'
export default function Playlist({ playlist, navigation }: PlaylistProps): React.JSX.Element {
	const {
		scroll,
		playlistTracks,
		isPending,
		editing,
		refetch,
		setPlaylistTracks,
		useUpdatePlaylist,
		useRemoveFromPlaylist,
	} = usePlaylistContext()

	const scrollOffsetHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			'worklet'
			scroll.value = event.contentOffset.y
		},
	})

	return (
		<AnimatedDraggableFlatList
			refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			contentInsetAdjustmentBehavior='automatic'
			data={playlistTracks ?? []}
			dragHitSlop={{ left: -50 }} // https://github.com/computerjazz/react-native-draggable-flatlist/issues/336
			keyExtractor={(item, index) => {
				return `${index}-${item.Id}`
			}}
			ItemSeparatorComponent={() => <Separator />}
			ListHeaderComponent={() => PlayliistTracklistHeader(playlist, navigation, editing)}
			stickyHeaderIndices={[0]}
			numColumns={1}
			onDragBegin={() => {
				trigger('impactMedium')
			}}
			onDragEnd={({ data, from, to }) => {
				console.debug(`Moving playlist item from ${from} to ${to}`)

				useUpdatePlaylist.mutate(
					{
						playlist,
						tracks: data,
					},
					{
						onSuccess: () => {
							setPlaylistTracks(data)
						},
					},
				)
			}}
			refreshing={isPending}
			renderItem={({ item: track, getIndex, drag }) => (
				<XStack alignItems='center'>
					{editing && <Icon name='drag' onPress={drag} />}

					<Track
						navigation={navigation}
						track={track}
						tracklist={playlistTracks ?? []}
						index={getIndex() ?? 0}
						queue={playlist}
						showArtwork
						onLongPress={() => {
							editing
								? drag()
								: navigation.navigate('Details', {
										item: track,
										isNested: false,
									})
						}}
						showRemove={editing}
						onRemove={() =>
							useRemoveFromPlaylist.mutate({ playlist, track, index: getIndex()! })
						}
					/>
				</XStack>
			)}
			style={{
				marginHorizontal: 2,
			}}
			onScroll={scrollOffsetHandler}
			removeClippedSubviews
		/>
	)
}
