import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, XStack } from 'tamagui'
import { useLayoutEffect, useState } from 'react'
import JellifyTrack from '../../types/JellifyTrack'
import {
	useRemoveFromQueue,
	useRemoveUpcomingTracks,
	useReorderQueue,
	useSkip,
} from '../../providers/Player/hooks/callbacks'
import { usePlayerQueueStore, useQueueRef } from '../../stores/player/queue'
import Sortable from 'react-native-sortables'
import { OrderChangeParams, RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import uuid from 'react-native-uuid'
import Animated, { useAnimatedRef } from 'react-native-reanimated'
import TrackPlayer from 'react-native-track-player'

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

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	const [reducedHaptics] = useReducedHapticsSetting()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<XStack gap='$1'>
						<Text color={'$warning'} marginVertical={'auto'} fontWeight={'bold'}>
							Clear
						</Text>
						<Icon
							name='broom'
							color='$warning'
							onPress={async () => {
								await removeUpcomingTracks()
								setQueue((await TrackPlayer.getQueue()) as JellifyTrack[])
							}}
						/>
					</XStack>
				)
			},
		})
	}, [])

	const keyExtractor = (item: JellifyTrack) => `${item.item.Id}`

	// Memoize renderItem function for better performance
	const renderItem = ({ item: queueItem, index }: RenderItemInfo<JellifyTrack>) => (
		<XStack alignItems='center'>
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
	)

	const handleReorder = async ({ fromIndex, toIndex }: OrderChangeParams) =>
		await reorderQueue({ fromIndex, toIndex })

	return (
		<Animated.ScrollView
			style={containerStyle}
			contentInsetAdjustmentBehavior='automatic'
			ref={scrollableRef}
		>
			<Sortable.Grid
				autoScrollDirection='vertical'
				autoScrollEnabled
				data={queue}
				columns={1}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				onOrderChange={handleReorder}
				onDragEnd={({ data }) => setQueue(data)}
				overDrag='vertical'
				customHandle
				hapticsEnabled={!reducedHaptics}
				scrollableRef={scrollableRef}
			/>
		</Animated.ScrollView>
	)
}

const containerStyle = {
	flex: 1,
}
