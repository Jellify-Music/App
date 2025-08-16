import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { RootStackParamList } from '../../screens/types'
import { useNowPlayingContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { Separator, XStack } from 'tamagui'
import {
	useRemoveUpcomingTracksContext,
	useRemoveFromQueueContext,
	useReorderQueueContext,
	useSkipContext,
	useQueueRefContext,
	usePlayQueueContext,
} from '../../providers/Player/queue'
import { trigger } from 'react-native-haptic-feedback'
import { isUndefined } from 'lodash'
import { useLayoutEffect, useCallback, useMemo } from 'react'
import JellifyTrack from '../../types/JellifyTrack'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const nowPlaying = useNowPlayingContext()

	const playQueue = usePlayQueueContext()
	const queueRef = useQueueRefContext()
	const useRemoveUpcomingTracks = useRemoveUpcomingTracksContext()
	const useRemoveFromQueue = useRemoveFromQueueContext()
	const useReorderQueue = useReorderQueueContext()
	const useSkip = useSkipContext()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<Icon
						name='notification-clear-all'
						onPress={() => {
							useRemoveUpcomingTracks.mutate()
						}}
					/>
				)
			},
		})
	}, [navigation, useRemoveUpcomingTracks])

	// Memoize scroll index calculation
	const scrollIndex = useMemo(
		() => playQueue.findIndex((queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!),
		[playQueue, nowPlaying?.item.Id],
	)

	// Memoize key extractor for better performance
	const keyExtractor = useCallback(
		(item: JellifyTrack, index: number) => `${index}-${item.item.Id}`,
		[],
	)

	// Memoize getItemLayout for better performance
	const getItemLayout = useCallback(
		(data: ArrayLike<JellifyTrack> | null | undefined, index: number) => ({
			length: 20,
			offset: (20 / 9) * index,
			index,
		}),
		[],
	)

	// Memoize ItemSeparatorComponent to prevent recreation
	const ItemSeparatorComponent = useCallback(() => <Separator />, [])

	// Memoize onDragEnd handler
	const handleDragEnd = useCallback(
		({ from, to }: { from: number; to: number }) => {
			useReorderQueue({ from, to })
		},
		[useReorderQueue],
	)

	// Memoize renderItem function for better performance
	const renderItem = useCallback(
		({ item: queueItem, getIndex, drag, isActive }: RenderItemParams<JellifyTrack>) => {
			const index = getIndex()

			const handleLongPress = () => {
				trigger('impactLight')
				drag()
			}

			const handlePress = () => {
				if (!isUndefined(index)) useSkip(index)
			}

			const handleRemove = () => {
				if (!isUndefined(index)) useRemoveFromQueue.mutate(index)
			}

			return (
				<XStack alignItems='center' onLongPress={handleLongPress}>
					<Track
						queue={queueRef}
						track={queueItem.item}
						index={index ?? 0}
						showArtwork
						testID={`queue-item-${index}`}
						onPress={handlePress}
						onLongPress={handleLongPress}
						isNested
						showRemove
						onRemove={handleRemove}
					/>
				</XStack>
			)
		},
		[queueRef, navigation, useSkip, useRemoveFromQueue],
	)

	return (
		<DraggableFlatList
			contentInsetAdjustmentBehavior='automatic'
			data={playQueue}
			dragHitSlop={{
				left: -50, // https://github.com/computerjazz/react-native-draggable-flatlist/issues/336
			}}
			extraData={nowPlaying?.item.Id} // Only track the playing track ID, not the entire object
			getItemLayout={getItemLayout}
			initialScrollIndex={scrollIndex !== -1 ? scrollIndex : 0}
			ItemSeparatorComponent={ItemSeparatorComponent}
			keyExtractor={keyExtractor}
			numColumns={1}
			onDragEnd={handleDragEnd}
			renderItem={renderItem}
			removeClippedSubviews={true}
			maxToRenderPerBatch={10}
			windowSize={10}
			updateCellsBatchingPeriod={50}
		/>
	)
}
