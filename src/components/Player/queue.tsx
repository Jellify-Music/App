import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ScrollView, XStack } from 'tamagui'
import { useLayoutEffect, useCallback, useState } from 'react'
import JellifyTrack from '../../types/JellifyTrack'
import {
	useRemoveFromQueue,
	useRemoveUpcomingTracks,
	useReorderQueue,
	useSkip,
} from '../../providers/Player/hooks/mutations'
import { usePlayerQueueStore, useQueueRef } from '../../stores/player/queue'
import Sortable from 'react-native-sortables'
import { RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { useReducedHapticsSetting } from '../../stores/settings/app'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const playQueue = usePlayerQueueStore.getState().queue
	const [queue, setQueue] = useState<JellifyTrack[]>(playQueue)

	const queueRef = useQueueRef()
	const removeUpcomingTracks = useRemoveUpcomingTracks()
	const removeFromQueue = useRemoveFromQueue()
	const reorderQueue = useReorderQueue()
	const skip = useSkip()

	const [reducedHaptics] = useReducedHapticsSetting()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return <Icon name='notification-clear-all' onPress={removeUpcomingTracks} />
			},
		})
	}, [navigation, removeUpcomingTracks])

	const keyExtractor = useCallback((item: JellifyTrack) => `${item.item.Id}`, [])

	// Memoize renderItem function for better performance
	const renderItem = useCallback(
		({ item: queueItem, index }: RenderItemInfo<JellifyTrack>) => (
			<XStack alignItems='center' key={`${index}-${queueItem.item.Id}`}>
				<Sortable.Handle style={{ display: 'flex', flexShrink: 1 }}>
					<Icon name='drag' />
				</Sortable.Handle>

				<Sortable.Touchable
					onTap={() => skip(index)}
					style={{
						flexGrow: 1,
					}}
				>
					<Track
						queue={queueRef ?? 'Recently Played'}
						track={queueItem.item}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						isNested
						editing
					/>
				</Sortable.Touchable>

				<Sortable.Touchable
					onTap={async () => {
						setQueue(queue.filter(({ item }) => item.Id !== queueItem.item.Id))
						await removeFromQueue(index)
					}}
				>
					<Icon name='close' color='$warning' />
				</Sortable.Touchable>
			</XStack>
		),
		[queueRef, skip, removeFromQueue],
	)

	return (
		<ScrollView flex={1} contentInsetAdjustmentBehavior='automatic'>
			<Sortable.Grid
				data={queue}
				columns={1}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onOrderChange={reorderQueue}
				onDragEnd={({ data }) => {
					setQueue(data)
				}}
				overDrag='vertical'
				customHandle
				hapticsEnabled={!reducedHaptics}
			/>
		</ScrollView>
	)
}
