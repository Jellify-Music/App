import Icon from '../Global/components/icon'
import Track from '../Global/components/track'
import { StackParamList } from '../types'
import { usePlayerContext } from '../../providers/Player'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { getTokenValue, Separator, XStack } from 'tamagui'
import FlashDragList from 'react-native-flashdrag-list'
import { useQueueContext } from '../../providers/Player/queue'
import { isUndefined } from 'lodash'
import JellifyTrack from '../../types/JellifyTrack'
import { trigger } from 'react-native-haptic-feedback'

export default function Queue({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const {
		playQueue,
		queueRef,
		useRemoveUpcomingTracks,
		useRemoveFromQueue,
		useReorderQueue,
		useSkip,
	} = useQueueContext()

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

	const scrollIndex = playQueue.findIndex(
		(queueItem) => queueItem.item.Id! === nowPlaying!.item.Id!,
	)

	return (
		<FlashDragList
			contentInsetAdjustmentBehavior='automatic'
			data={playQueue}
			extraData={[nowPlaying]}
			itemsSize={getTokenValue('$12') + getTokenValue('$6')}
			initialScrollIndex={scrollIndex !== -1 ? scrollIndex : 0}
			ItemSeparatorComponent={() => <Separator />}
			keyExtractor={({ item }, index) => item.Id}
			numColumns={1}
			onSort={(from, to) => {
				useReorderQueue.mutate({ from, to })
			}}
			renderItem={(
				item: JellifyTrack,
				index: number,
				active: boolean,
				beginDrag: () => void,
			) => (
				<XStack alignItems='center'>
					<Icon
						name='drag'
						onPressIn={() => {
							trigger('impactLight')
							beginDrag()
						}}
					/>

					<Track
						queue={queueRef}
						navigation={navigation}
						track={item.item}
						index={index}
						showArtwork
						testID={`queue-item-${index}`}
						onPress={() => {
							if (!isUndefined(index)) useSkip.mutate(index)
						}}
						isNested
						showRemove
						onRemove={() => {
							if (!isUndefined(index)) useRemoveFromQueue.mutate(index)
						}}
					/>
				</XStack>
			)}
		/>
	)
}
