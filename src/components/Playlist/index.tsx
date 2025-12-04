import { ScrollView, Separator, Spinner, useTheme, XStack, YStack } from 'tamagui'
import Track from '../Global/components/track'
import Icon from '../Global/components/icon'
import { PlaylistProps } from './interfaces'
import { StackActions, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Sortable from 'react-native-sortables'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import { RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import PlaylistTracklistHeader from './components/header'
import navigationRef from '../../../navigation'
import { useLoadNewQueue } from '../../providers/Player/hooks/mutations'
import { useNetworkStatus } from '../../stores/network'
import { QueuingType } from '../../enums/queuing-type'
import { useApi } from '../../stores'
import useStreamingDeviceProfile from '../../stores/device-profile'
import { RefreshControl } from 'react-native-gesture-handler'
import { useEffect, useLayoutEffect, useState } from 'react'
import { updatePlaylist } from '../../../src/api/mutations/playlists'
import { usePlaylistTracks } from '../../../src/api/queries/playlist'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useMutation } from '@tanstack/react-query'
import Animated, { SlideInLeft, SlideOutRight } from 'react-native-reanimated'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { Text } from '../Global/helpers/text'

export default function Playlist({
	playlist,
	navigation,
	canEdit,
}: PlaylistProps): React.JSX.Element {
	const api = useApi()

	const theme = useTheme()

	const [editing, setEditing] = useState<boolean>(false)

	const [newName, setNewName] = useState<string>(playlist.Name ?? '')

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[] | undefined>(undefined)

	const trigger = useHapticFeedback()

	const {
		data: tracks,
		isPending,
		refetch,
		isSuccess,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = usePlaylistTracks(playlist)

	const { mutate: useUpdatePlaylist, isPending: isUpdating } = useMutation({
		mutationFn: ({
			playlist,
			tracks,
			newName,
		}: {
			playlist: BaseItemDto
			tracks: BaseItemDto[]
			newName: string
		}) => {
			return updatePlaylist(
				api,
				playlist.Id!,
				newName,
				tracks.map((track) => track.Id!),
			)
		},
		onSuccess: () => {
			trigger('notificationSuccess')

			// Refresh playlist component data
			refetch()
		},
		onError: () => {
			trigger('notificationError')
			setNewName(playlist.Name ?? '')
			setPlaylistTracks(tracks ?? [])
		},
		onSettled: () => {
			setEditing(false)
		},
	})

	const handleCancel = () => {
		setEditing(false)
		setNewName(playlist.Name ?? '')
		setPlaylistTracks(tracks)
	}

	useEffect(() => {
		if (!isPending && isSuccess) setPlaylistTracks(tracks)
	}, [tracks, isPending, isSuccess])

	useEffect(() => {
		if (!editing) refetch()
	}, [editing])

	const loadNewQueue = useLoadNewQueue()

	const [networkStatus] = useNetworkStatus()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () =>
				canEdit && (
					<XStack gap={'$3'}>
						{editing && (
							<>
								<Icon
									color={'$danger'}
									name='delete-sweep-outline' // otherwise use "delete-circle"
									onPress={() => {
										navigationRef.dispatch(
											StackActions.push('DeletePlaylist', { playlist }),
										)
									}}
								/>

								<Icon
									color='$neutral'
									name='close-circle-outline'
									onPress={handleCancel}
								/>
							</>
						)}

						{!isUpdating ? (
							<Icon
								name={editing ? 'floppy' : 'pencil'}
								color={editing ? '$success' : '$color'}
								onPress={() =>
									!editing
										? setEditing(true)
										: useUpdatePlaylist({
												playlist,
												tracks: playlistTracks ?? [],
												newName,
											})
								}
							/>
						) : (
							<Spinner color={'$success'} />
						)}
					</XStack>
				),
		})
	}, [
		editing,
		navigation,
		canEdit,
		playlist,
		handleCancel,
		isUpdating,
		useUpdatePlaylist,
		playlistTracks,
		newName,
		setEditing,
	])

	const [reducedHaptics] = useReducedHapticsSetting()

	const streamingDeviceProfile = useStreamingDeviceProfile()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	// Render item for Sortable.Grid (edit mode only)
	const renderSortableItem = ({ item: track, index }: RenderItemInfo<BaseItemDto>) => {
		const handlePress = async () => {
			await loadNewQueue({
				track,
				tracklist: playlistTracks ?? [],
				api,
				networkStatus,
				deviceProfile: streamingDeviceProfile,
				index,
				queue: playlist,
				queuingType: QueuingType.FromSelection,
				startPlayback: true,
			})
		}

		return (
			<XStack alignItems='center' key={`${index}-${track.Id}`} flex={1}>
				<Animated.View entering={SlideInLeft} exiting={SlideOutRight}>
					<Sortable.Handle>
						<Icon name='drag' />
					</Sortable.Handle>
				</Animated.View>

				<Sortable.Touchable
					style={{ flexGrow: 1 }}
					onTap={handlePress}
					onLongPress={() => {
						rootNavigation.navigate('Context', {
							item: track,
							navigation,
						})
					}}
				>
					<Track
						navigation={navigation}
						track={track}
						tracklist={playlistTracks ?? []}
						index={index}
						queue={playlist}
						showArtwork
						editing={editing}
					/>
				</Sortable.Touchable>

				<Sortable.Touchable
					onTap={() => {
						setPlaylistTracks(
							(playlistTracks ?? []).filter(({ Id }) => Id !== track.Id),
						)
					}}
				>
					<Icon name='close' color={'$danger'} />
				</Sortable.Touchable>
			</XStack>
		)
	}

	// Render item for FlashList (normal virtualized mode)
	const renderFlashListItem: ListRenderItem<BaseItemDto> = ({ item: track, index }) => {
		return (
			<Track
				navigation={navigation}
				track={track}
				tracklist={playlistTracks ?? []}
				index={index}
				queue={playlist}
				showArtwork
				onPress={async () => {
					await loadNewQueue({
						track,
						tracklist: playlistTracks ?? [],
						api,
						networkStatus,
						deviceProfile: streamingDeviceProfile,
						index,
						queue: playlist,
						queuingType: QueuingType.FromSelection,
						startPlayback: true,
					})
				}}
			/>
		)
	}

	const keyExtractor = (item: BaseItemDto) => item.Id!

	const handleEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}

	// Edit mode: use Sortable.Grid inside ScrollView (not virtualized, but supports drag-and-drop)
	if (editing) {
		return (
			<ScrollView
				flex={1}
				refreshControl={
					<RefreshControl
						refreshing={isPending}
						onRefresh={refetch}
						tintColor={theme.primary.val}
					/>
				}
			>
				<PlaylistTracklistHeader
					setNewName={setNewName}
					newName={newName}
					editing={editing}
					playlist={playlist}
					playlistTracks={playlistTracks}
				/>

				<Sortable.Grid
					data={playlistTracks ?? []}
					keyExtractor={keyExtractor}
					autoScrollEnabled
					columns={1}
					customHandle
					overDrag='vertical'
					sortEnabled={canEdit}
					onDragEnd={({ data }) => setPlaylistTracks(data)}
					renderItem={renderSortableItem}
					hapticsEnabled={!reducedHaptics}
				/>
			</ScrollView>
		)
	}

	// Normal mode: use FlashList for virtualized performance
	return (
		<FlashList
			data={playlistTracks ?? []}
			keyExtractor={keyExtractor}
			renderItem={renderFlashListItem}
			// @ts-expect-error - estimatedItemSize is required by FlashList but types are incorrect
			estimatedItemSize={72}
			onEndReached={handleEndReached}
			onEndReachedThreshold={0.5}
			refreshControl={
				<RefreshControl
					refreshing={isPending}
					onRefresh={refetch}
					tintColor={theme.primary.val}
				/>
			}
			ItemSeparatorComponent={() => <Separator />}
			ListHeaderComponent={
				<PlaylistTracklistHeader
					setNewName={setNewName}
					newName={newName}
					editing={editing}
					playlist={playlist}
					playlistTracks={playlistTracks}
				/>
			}
			ListEmptyComponent={
				isPending ? null : (
					<YStack flex={1} justify='center' alignItems='center' padding='$4'>
						<Text color='$borderColor'>No tracks in this playlist</Text>
					</YStack>
				)
			}
			ListFooterComponent={
				isFetchingNextPage ? (
					<YStack padding='$4' alignItems='center'>
						<Spinner color='$primary' />
					</YStack>
				) : null
			}
		/>
	)
}
