import { getTokenValue, Separator } from 'tamagui'
import Track from '../Global/components/track'
import { RefreshControl } from 'react-native'
import { PlaylistProps } from './interfaces'
import PlayliistTracklistHeader from './components/header'
import { usePlaylistContext } from '../../providers/Playlist'
import FlashDragList from 'react-native-flashdrag-list'
import DraggableTrack from '../Global/components/draggable-track'
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

	return (
		<FlashDragList
			refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			contentInsetAdjustmentBehavior='automatic'
			data={playlistTracks ?? []}
			keyExtractor={(item, index) => {
				return `${index}-${item.Id}`
			}}
			itemsSize={getTokenValue('$12') + getTokenValue('$6')}
			ItemSeparatorComponent={() => <Separator />}
			ListHeaderComponent={() =>
				PlayliistTracklistHeader(playlist, navigation, editing, playlistTracks ?? [])
			}
			onSort={(from, to) => {
				console.debug(`Moving playlist item from ${from} to ${to}`)

				const playlistCopy = [...(playlistTracks ?? [])]

				const movedTrack = playlistCopy.splice(from, 1)[0]
				playlistCopy.splice(to, 0, movedTrack)

				useUpdatePlaylist.mutate(
					{
						playlist,
						tracks: playlistCopy,
					},
					{
						onSuccess: () => {
							setPlaylistTracks(playlistCopy)
						},
					},
				)
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
