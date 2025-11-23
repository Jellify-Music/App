import { ScrollView, XStack, YStack } from 'tamagui'
import Track from '../Global/components/track'
import Icon from '../Global/components/icon'
import { PlaylistProps } from './interfaces'
import { usePlaylistContext } from '../../providers/Playlist'
import { StackActions, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Sortable from 'react-native-sortables'
import { useCallback, useLayoutEffect } from 'react'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import { RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import PlaylistTracklistHeader from './components/header'
import navigationRef from '../../../navigation'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'

export default function Playlist({
	playlist,
	navigation,
	canEdit,
}: PlaylistProps): React.JSX.Element {
	const {
		playlistTracks,
		editing,
		setEditing,
		setPlaylistTracks,
		useUpdatePlaylist,
		useRemoveFromPlaylist,
	} = usePlaylistContext()

	const loadNewQueue = useLoadNewQueue()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () =>
				canEdit && (
					<XStack gap={'$3'}>
						{editing && (
							<Icon
								color={'$danger'}
								name='delete-sweep-outline' // otherwise use "delete-circle"
								onPress={() => {
									navigationRef.dispatch(
										StackActions.push('DeletePlaylist', { playlist }),
									)
								}}
							/>
						)}

						<Icon
							name={editing ? 'floppy' : 'pencil'}
							color={editing ? '$success' : '$color'}
							onPress={() => setEditing(!editing)}
						/>
					</XStack>
				),
		})
	}, [editing, navigation, canEdit, playlist])

	const [reducedHaptics] = useReducedHapticsSetting()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const renderItem = useCallback(
		({ item: track, index }: RenderItemInfo<BaseItemDto>) => (
			<XStack alignItems='center' key={`${index}-${track.Id}`} flex={1}>
				{editing && (
					<Sortable.Handle>
						<Icon name='drag' />
					</Sortable.Handle>
				)}

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
					isNested
				/>
			</XStack>
		),
		[navigation, playlist, playlistTracks, editing, useRemoveFromPlaylist],
	)

	return (
		<ScrollView flex={1}>
			<PlaylistTracklistHeader />

			<Sortable.Grid
				data={playlistTracks ?? []}
				keyExtractor={(item) => {
					return `${item.Id}`
				}}
				columns={1}
				customHandle
				overDrag='vertical'
				sortEnabled={canEdit && editing}
				onDragEnd={({ data }) => {
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
