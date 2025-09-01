import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { Separator, XStack } from 'tamagui'
import { isUndefined } from 'lodash'
import { useLayoutEffect, useCallback, useMemo } from 'react'
import JellifyTrack from '../../types/JellifyTrack'
import { useNowPlaying, useQueue, useQueueRef } from '../../providers/Player/hooks/queries'
import {
	useRemoveFromQueue,
	useRemoveUpcomingTracks,
	useReorderQueue,
	useSkip,
} from '../../providers/Player/hooks/mutations'
import useHapticFeedback from '../../hooks/use-haptic-feedback'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const { data: nowPlaying } = useNowPlaying()

	const { data: playQueue } = useQueue()
	const { data: queueRef } = useQueueRef()
	const { mutate: removeUpcomingTracks } = useRemoveUpcomingTracks()
	const { mutate: removeFromQueue } = useRemoveFromQueue()
	const { mutate: reorderQueue } = useReorderQueue()
	const { mutate: skip } = useSkip()

	const trigger = useHapticFeedback()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return <Icon name='notification-clear-all' onPress={removeUpcomingTracks} />
			},
		})
	}, [navigation, removeUpcomingTracks])

	// Memoize scroll index calculation
	const scrollIndex = useMemo(
		() => playQueue?.findIndex((queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!),
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
			reorderQueue({ from, to })
		},
		[reorderQueue],
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
				if (!isUndefined(index)) skip(index)
			}

			const handleRemove = () => {
				if (!isUndefined(index)) removeFromQueue(index)
			}

			return (
				<XStack alignItems='center' onLongPress={handleLongPress}>
					<Track
						queue={queueRef ?? 'Recently Played'}
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
			data={playQueue ?? []}
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
