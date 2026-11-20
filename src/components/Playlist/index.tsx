import { Spinner, XStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { StackActions, useNavigation } from '@react-navigation/native'
import { BaseStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import navigationRef from '../../screens/navigation'
import { useLayoutEffect } from 'react'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { ListRenderItemInfo, RefreshControl } from 'react-native'
import { useCollectionDownload } from '../../hooks/downloads/collection'
import DownloadButton from '../Global/components/download-button'
import { DraxList, DraxProvider } from 'react-native-drax'
import { usePlaylistContext } from '../../providers/Playlist'
import PlaylistTrack from './components/track'
import { LegendList } from '@legendapp/list/react-native'
import { itemDraxViewProps } from '../../configs/styling/drax'
import PlaylistTracklistHeader from './components/header'
import { ITEM_ROW_HEIGHT } from '../../configs/styling/dimensions'
import { ItemKeyExtractor } from '../../utils/parsing/key-extractor'

export default function Playlist(): React.JSX.Element {
	const {
		playlist,
		playlistTracks,
		editing,
		setEditing,
		canEdit,
		newName,
		updatePlaylist,
		refetch,
		isUpdatingPlaylist,
		onCancelEditing,
		onReorder,
		isPending,
	} = usePlaylistContext()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const collection = useCollectionDownload(playlistTracks)

	const editModeActions = (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<XStack gap='2'>
				<Icon
					color={'warning'}
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

				<Icon color='neutral' name='close-circle-outline' onPress={onCancelEditing} />
			</XStack>
		</Animated.View>
	)

	// remounted for each state, so that each fades in, as the buttons did before
	const downloadActions = (
		<Animated.View
			key={collection.state}
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<DownloadButton collection={collection} />
		</Animated.View>
	)

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<XStack gap='2'>
					{playlistTracks && !editing && downloadActions}
					{canEdit && (
						<XStack gap='2'>
							{editing ? (
								editModeActions
							) : isUpdatingPlaylist ? (
								<Spinner color='primary' />
							) : null}
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								layout={LinearTransition.springify()}
							>
								<Icon
									name={editing ? 'floppy' : 'pencil'}
									color={editing ? 'success' : 'color'}
									onPress={() =>
										!editing
											? setEditing(true)
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
		playlistTracks,
		newName,
		setEditing,
		// the button's values, not the object they come in, which is new every time
		collection.state,
		collection.progress,
	])

	const renderItem = (info: ListRenderItemInfo<BaseItemDto>) => <PlaylistTrack {...info} />

	const onRefresh = async () => {
		await refetch()
	}

	return (
		<DraxProvider>
			<DraxList<BaseItemDto>
				component={LegendList}
				animationConfig={'spring'}
				contentInsetAdjustmentBehavior='automatic'
				ListHeaderComponent={<PlaylistTracklistHeader />}
				data={playlistTracks}
				lockToMainAxis
				itemDraxViewProps={itemDraxViewProps}
				keyExtractor={ItemKeyExtractor}
				renderItem={renderItem}
				onReorder={onReorder}
				estimatedItemSize={ITEM_ROW_HEIGHT}
				refreshControl={<RefreshControl refreshing={isPending} onRefresh={onRefresh} />}
			/>
		</DraxProvider>
	)
}
