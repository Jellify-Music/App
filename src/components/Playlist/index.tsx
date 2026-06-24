import { Spinner, XStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { StackActions, useNavigation } from '@react-navigation/native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import navigationRef from '../../screens/navigation'
import { useLayoutEffect, useState } from 'react'
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	LinearTransition,
	useSharedValue,
} from 'react-native-reanimated'
import { ListRenderItemInfo, RefreshControl } from 'react-native'
import { useAreAllDownloaded } from '../../hooks/downloads'
import useDownloadTracks, { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import { DraxList, DraxProvider } from 'react-native-drax'
import { usePlaylistContext } from '../../providers/Playlist'
import PlaylistTrack from './components/track'
import { LegendList } from '@legendapp/list/react-native'
import { itemDraxViewProps } from '../../configs/styling/drax'
import PlaylistTracklistHeader from './components/header'

export default function Playlist(): React.JSX.Element {
	const {
		playlist,
		playlistTracks,
		playlistTrackIds,
		editing,
		setEditing,
		canEdit,
		newName,
		setNewName,
		updatePlaylist,
		refetch,
		isUpdatingPlaylist,
		onCancelEditing,
		onReorder,
		hasNextPage,
		fetchNextPage,
		isPending,
		isFetchingNextPage,
	} = usePlaylistContext()

	const navigation = useNavigation()

	// State to track when we're loading all pages before entering edit mode
	const [isPreparingEditMode, setIsPreparingEditMode] = useState<boolean>(false)

	const scrollPosition = useSharedValue({ x: 0, y: 0 })

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

				<Icon color='$neutral' name='close-circle-outline' onPress={onCancelEditing} />
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
							) : isUpdatingPlaylist || isPreparingEditMode ? (
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
											: updatePlaylist({
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
		onCancelEditing,
		updatePlaylist,
		isPreparingEditMode,
		handleEnterEditMode,
		playlistTracks,
		newName,
		setEditing,
	])

	const keyExtractor = (item: BaseItemDto) => item.Id!

	const handleEndReached = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage()
		}
	}

	const renderItem = (info: ListRenderItemInfo<BaseItemDto>) => <PlaylistTrack {...info} />

	return (
		<DraxProvider>
			<DraxList<BaseItemDto>
				component={LegendList}
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior='automatic'
				containerStyle={{
					flex: 1,
				}}
				ListHeaderComponent={<PlaylistTracklistHeader />}
				data={playlistTracks}
				lockToMainAxis
				itemDraxViewProps={itemDraxViewProps}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				onEndReached={handleEndReached}
				estimatedItemSize={50}
				refreshControl={<RefreshControl refreshing={isPending} onRefresh={refetch} />}
			/>
		</DraxProvider>
	)
}
