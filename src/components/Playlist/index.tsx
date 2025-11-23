import { ScrollView, XStack } from 'tamagui'
import Track from '../Global/components/track'
import Icon from '../Global/components/icon'
import { PlaylistProps } from './interfaces'
import { usePlaylistContext } from '../../providers/Playlist'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Sortable from 'react-native-sortables'
import { useCallback, useLayoutEffect } from 'react'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import { RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export default function Playlist({
	playlist,
	navigation,
	canEdit,
}: PlaylistProps): React.JSX.Element {
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => canEdit && <Icon small name={editing ? 'save' : 'pencil'} />,
		})
	})

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

	const [reducedHaptics] = useReducedHapticsSetting()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const renderItem = useCallback(
		({ item: track, index }: RenderItemInfo<BaseItemDto>) => (
			<XStack alignItems='center' key={`${index}-${track.Id}`}>
				<Sortable.Handle>
					<Icon name='drag' />
				</Sortable.Handle>

				<Track
					navigation={navigation}
					track={track}
					tracklist={playlistTracks ?? []}
					index={index}
					queue={playlist}
					showArtwork
					onLongPress={() => {
						if (!editing)
							rootNavigation.navigate('Context', {
								item: track,
								navigation,
							})
					}}
					showRemove={editing}
					onRemove={() => useRemoveFromPlaylist.mutate({ playlist, track, index })}
					isNested={editing}
				/>
			</XStack>
		),
		[navigation, playlist, playlistTracks, editing, useRemoveFromPlaylist],
	)

	return (
		<ScrollView flex={1}>
			<Sortable.Grid
				data={playlistTracks ?? []}
				keyExtractor={(item) => {
					return `${item.Id}`
				}}
				columns={1}
				customHandle
				overDrag='vertical'
				sortEnabled={canEdit && editing}
				onDragEnd={({ fromIndex, toIndex, data }) => {
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
				renderItem={renderItem}
				hapticsEnabled={!reducedHaptics}
			/>
		</ScrollView>
	)
}
