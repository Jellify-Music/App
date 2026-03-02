import Icon from '../Global/components/icon'
import Track from '../Global/components/Track'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Text, XStack } from 'tamagui'
import { useLayoutEffect, useRef, useState } from 'react'
import { useRemoveFromQueue, useReorderQueue, useSkip } from '../../hooks/player/callbacks'
import { useCurrentIndex, usePlayerQueueStore, useQueueRef } from '../../stores/player/queue'
import Sortable from 'react-native-sortables'
import { OrderChangeParams, RenderItemInfo } from 'react-native-sortables/dist/typescript/types'
import { useReducedHapticsSetting } from '../../stores/settings/app'
import Animated, { useAnimatedRef } from 'react-native-reanimated'
import { TrackItem } from 'react-native-nitro-player'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { View } from 'react-native'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<RootStackParamList>
}): React.JSX.Element {
	const playQueue = usePlayerQueueStore.getState().queue
	const [queue, setQueue] = useState<TrackItem[]>(playQueue)

	const currentIndex = useCurrentIndex()

	const queueRef = useQueueRef()
	const removeFromQueue = useRemoveFromQueue()
	const reorderQueue = useReorderQueue()
	const skip = useSkip()

	const scrollableRef = useAnimatedRef<Animated.ScrollView>()

	const [reducedHaptics] = useReducedHapticsSetting()

	const trackItemRef = useRef<View | null>(null)

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => {
				return (
					<XStack gap='$1'>
						<Text color={'$warning'} marginVertical={'auto'} fontWeight={'bold'}>
							Clear
						</Text>
						<Icon name='broom' color='$warning' onPress={async () => {}} />
					</XStack>
				)
			},
		})
	}, [])

	const keyExtractor = (item: TrackItem) => `${item.id}`

	const renderItem = ({ item: queueItem, index }: RenderItemInfo<TrackItem>) => {
		const track = getTrackDto(queueItem)!

		const onTap = async () => await skip(index)

		return (
			<XStack alignItems='center' ref={index === 0 ? trackItemRef : undefined}>
				<Sortable.Handle style={{ display: 'flex', flexShrink: 1 }}>
					<Icon name='drag' />
				</Sortable.Handle>

				<Sortable.Touchable
					onTap={onTap}
					style={{
						flexGrow: 1,
					}}
				>
					<Track
						queue={queueRef ?? 'Recently Played'}
						track={track}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						isNested
						editing
					/>
				</Sortable.Touchable>

				<Sortable.Touchable
					onTap={async () => {
						setQueue(queue.filter(({ id }) => id !== queueItem.id))
						await removeFromQueue(index)
					}}
				>
					<Icon name='close' color='$warning' />
				</Sortable.Touchable>
			</XStack>
		)
	}

	const handleReorder = async ({ fromIndex, toIndex }: OrderChangeParams) =>
		await reorderQueue({ fromIndex, toIndex })

	const scrollToCurrentTrack = () => {
		if (currentIndex === undefined || currentIndex === null || !trackItemRef.current) return

		const scrollToY = currentIndex * trackItemRef.current.clientHeight

		scrollableRef.current?.scrollTo({
			y: scrollToY,
			animated: true,
		})
	}

	return (
		<Animated.ScrollView
			style={containerStyle}
			contentInsetAdjustmentBehavior='automatic'
			ref={scrollableRef}
			onLayout={scrollToCurrentTrack}
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
