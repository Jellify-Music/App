import { getTokenValue, Separator, XStack, YStack } from 'tamagui'
import Track from '../Global/components/track'
import { RefreshControl } from 'react-native'
import { PlaylistProps } from './interfaces'
import { usePlaylistContext } from '../../providers/Playlist'
import FlashDragList from 'react-native-flashdrag-list'
import DraggableTrack from '../Global/components/draggable-track'
import { useLayoutEffect } from 'react'
import Icon from '../Global/components/icon'

export default function Playlist({ playlist, navigation }: PlaylistProps): React.JSX.Element {
	const {
		setEditing,
		playlistTracks,
		setPlaylistTracks,
		isPending,
		editing,
		refetch,
		mutatePlaylist,
		useRemoveFromPlaylist,
	} = usePlaylistContext()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack>
					<Icon
						color={'$color'}
						name={editing ? 'content-save-outline' : 'pencil'}
						onPress={() => setEditing(!editing)}
						small
					/>
				</XStack>
			),
		})
	}, [editing, navigation])

	return (
		<FlashDragList
			refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			contentInsetAdjustmentBehavior='automatic'
			data={playlistTracks ?? []}
			keyExtractor={(item, index) => {
				return `${item.Id}`
			}}
			itemsSize={getTokenValue('$12') + getTokenValue('$6')}
			ItemSeparatorComponent={() => <Separator />}
			onSort={(from, to) => {
				console.debug(`Moving playlist item from ${from} to ${to}`)

				const playlistCopy = [...(playlistTracks ?? [])]

				const movedTrack = playlistCopy.splice(from, 1)[0]
				playlistCopy.splice(to, 0, movedTrack)

				setPlaylistTracks(playlistCopy)

				mutatePlaylist({
					playlist,
					tracks: playlistCopy,
				})
			}}
			refreshing={isPending}
			renderItem={(item, index, active, beginDrag) => (
				<>
					{editing ? (
						<DraggableTrack
							navigation={navigation}
							track={item}
							tracklist={playlistTracks ?? []}
							index={index}
							queue={playlist}
							showArtwork
							onRemove={() => {
								useRemoveFromPlaylist.mutate({
									playlist,
									track: item,
									index,
								})
							}}
							beginDrag={beginDrag}
						/>
					) : (
						<Track
							navigation={navigation}
							track={item}
							tracklist={playlistTracks ?? []}
							index={index}
							queue={playlist}
							showArtwork
						/>
					)}
				</>
			)}
			style={{
				marginHorizontal: 2,
			}}
			removeClippedSubviews
		/>
	)
}
