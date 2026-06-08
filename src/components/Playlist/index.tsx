import { ScrollView, Spinner, useTheme, XStack, YStack } from 'tamagui'
import Track from '../Global/components/Track'
import Icon from '../Global/components/icon'
import { PlaylistProps } from './interfaces'
import { StackActions, useNavigation } from '@react-navigation/native'
import { BaseStackParamList, RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import PlaylistTracklistHeader from './components/header'
import navigationRef from '../../screens/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePlaylistTracks } from '../../../src/api/queries/playlist'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { Text } from '../Global/helpers/text'
import { ListRenderItemInfo, RefreshControl, StyleSheet } from 'react-native'
import { useAreAllDownloaded } from '../../hooks/downloads'
import useDownloadTracks, { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { loadNewQueue } from '../../hooks/player/functions/queue'
import { ICON_PRESS_STYLES } from '../../configs/style.config'
import { useUpdatePlaylist } from '../../api/mutations/playlist'
import { applyHapticFeedback } from '../../utils/haptics'
import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native'
import {
	DraxHandle,
	DraxList,
	DraxProvider,
	DraxView,
	SortableReorderEvent,
} from 'react-native-drax'

export default function Playlist({ playlist, canEdit }: PlaylistProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const theme = useTheme()

	const [editing, setEditing] = useState<boolean>(false)

	// State to track when we're loading all pages before entering edit mode
	const [isPreparingEditMode, setIsPreparingEditMode] = useState<boolean>(false)

	const [newName, setNewName] = useState<string>(playlist.Name ?? '')

	const [playlistTracks, setPlaylistTracks] = useState<BaseItemDto[] | undefined>(undefined)

	const playlistTrackIds = useRef<string[]>([])

	const {
		data: tracks,
		isPending,
		refetch,
		isSuccess,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
	} = usePlaylistTracks(playlist)

	const updatePlaylist = useUpdatePlaylist({
		onSettled: () => {
			setEditing(false)
		},
		onError: () => {
			applyHapticFeedback('error')
			setNewName(playlist.Name ?? '')
			setPlaylistTracks(tracks)
			playlistTrackIds.current = tracks?.map((track) => track.Id!) ?? []
		},
	})

	const handleCancel = () => {
		setEditing(false)
		setNewName(playlist.Name ?? '')
		setPlaylistTracks(tracks)
	}

	/**
	 * Fetches all remaining pages before entering edit mode.
	 * This prevents data loss when saving a playlist that has unloaded tracks.
	 */
	const handleEnterEditMode = async () => {
		if (hasNextPage) {
			setIsPreparingEditMode(true)
			try {
				// Fetch all remaining pages
				let hasMore: boolean = hasNextPage
				while (hasMore) {
					const result = await fetchNextPage()
					hasMore = result.hasNextPage ?? false
				}
			} finally {
				setIsPreparingEditMode(false)
			}
		}
		setEditing(true)
	}

	useEffect(() => {
		if (!isPending && isSuccess) setPlaylistTracks(tracks)
	}, [tracks, isPending, isSuccess])

	useEffect(() => {
		if (!editing) refetch()
	}, [editing])

	const downloadTracks = useDownloadTracks()

	const isDownloaded = useAreAllDownloaded(playlistTrackIds.current)

	const { mutate: deleteDownloads } = useDeleteDownloads()

	const handleDeleteDownload = () => deleteDownloads(playlistTrackIds.current)

	const handleDownload = () => downloadTracks.mutate(playlistTracks ?? [])

	const editModeActions = (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<XStack gap={'$2'}>
				<Icon
					color={'$warning'}
					name='delete-sweep-outline' // otherwise use "delete-circle"
					onPress={() => {
						navigationRef.dispatch(
							StackActions.push('DeletePlaylist', {
								playlist,
								onDelete: navigation.goBack,
							}),
						)
					}}
				/>

				<Icon color='$neutral' name='close-circle-outline' onPress={handleCancel} />
			</XStack>
		</Animated.View>
	)

	const downloadActions = (
		<XStack gap={'$2'}>
			{playlistTracks &&
				(isDownloaded ? (
					<Animated.View
						entering={FadeIn.easing(Easing.in(Easing.ease))}
						exiting={FadeOut.easing(Easing.out(Easing.ease))}
						layout={LinearTransition.springify()}
					>
						<Icon
							color='$warning'
							name='broom'
							onPress={handleDeleteDownload}
							{...ICON_PRESS_STYLES}
						/>
					</Animated.View>
				) : downloadTracks.isPending ? (
					<Spinner justifyContent='center' color={'$success'} />
				) : (
					<Animated.View
						entering={FadeIn.easing(Easing.in(Easing.ease))}
						exiting={FadeOut.easing(Easing.out(Easing.ease))}
						layout={LinearTransition.springify()}
					>
						<Icon
							color='$success'
							name='download-circle-outline'
							onPress={handleDownload}
							{...ICON_PRESS_STYLES}
						/>
					</Animated.View>
				))}
		</XStack>
	)

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap={'$2'}>
					{playlistTracks && !editing && downloadActions}
					{canEdit && (
						<XStack gap={'$2'}>
							{editing ? (
								editModeActions
							) : updatePlaylist.isPending || isPreparingEditMode ? (
								<Spinner color={isPreparingEditMode ? '$primary' : '$success'} />
							) : null}
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								layout={LinearTransition.springify()}
							>
								<Icon
									name={editing ? 'floppy' : 'pencil'}
									color={editing ? '$success' : '$color'}
									onPress={() =>
										!editing
											? handleEnterEditMode()
											: updatePlaylist.mutate({
													playlist,
													tracks: playlistTracks ?? [],
													newName,
												})
									}
								/>
							</Animated.View>
						</XStack>
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
		updatePlaylist,
		isPreparingEditMode,
		handleEnterEditMode,
		playlistTracks,
		newName,
		setEditing,
	])

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const onReorder = (event: SortableReorderEvent<BaseItemDto>) => {
		setPlaylistTracks(event.data)
	}

	// Render item for Sortable.Grid (edit mode only)
	const renderSortableItem = ({
		item: track,
		index,
		...props
	}: ListRenderItemInfo<BaseItemDto>) => {
		const handlePress = async () => {
			await loadNewQueue({
				track,
				tracklist: playlistTracks ?? [],
				index,
				queue: playlist,
				startPlayback: true,
			})
		}

		return (
			<DraxView dragHandle style={styles.item}>
				<DraxHandle style={styles.handle}>
					<Icon name='drag' flexShrink={1} />
				</DraxHandle>

				<Track
					onPress={handlePress}
					onLongPress={() => {
						rootNavigation.navigate('Context', {
							item: track,
							navigation,
							playlist,
						})
					}}
					navigation={navigation}
					track={track}
					tracklist={playlistTracks ?? []}
					index={index}
					queue={playlist}
					playlist={playlist}
					showArtwork
					editing={editing}
				/>

				<Icon
					name='close'
					color={'$warning'}
					flexShrink={1}
					onPress={() => {
						setPlaylistTracks(
							(playlistTracks ?? []).filter(({ Id }) => Id !== track.Id),
						)
					}}
				/>
			</DraxView>
		)
	}

	// Render item for LegendList (normal virtualized mode)
	const renderListItem = ({ item: track, index }: LegendListRenderItemProps<BaseItemDto>) => {
		return (
			<Track
				navigation={navigation}
				track={track}
				tracklist={playlistTracks ?? []}
				index={index}
				queue={playlist}
				playlist={playlist}
				showArtwork
				testID={`playlist-track-${index}`}
			/>
		)
	}

	const keyExtractor = (item: BaseItemDto) => item.Id!

	const handleEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}

	// Normal mode: use LegendList for virtualized performance
	return (
		<DraxProvider>
			<ScrollView style={styles.container} nestedScrollEnabled>
				<PlaylistTracklistHeader
					setNewName={setNewName}
					newName={newName}
					editing={editing}
					playlist={playlist}
					playlistTracks={playlistTracks}
				/>

				{!editing ? (
					<LegendList
						contentInsetAdjustmentBehavior='automatic'
						data={playlistTracks ?? []}
						renderItem={renderListItem}
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
				) : (
					<DraxList<BaseItemDto>
						data={playlistTracks ?? []}
						keyExtractor={keyExtractor}
						renderItem={renderSortableItem}
						itemHeight={150}
						onReorder={onReorder}
					/>
				)}
			</ScrollView>
		</DraxProvider>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	item: {
		flexDirection: 'row',
		alignContent: 'center',
	},
	handle: {
		flexShrink: 1,
		marginVertical: 'auto',
	},
})
