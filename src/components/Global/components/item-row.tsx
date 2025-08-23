import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { RunTimeTicks } from '../helpers/time-codes'
import { useLoadQueueContext } from '../../../providers/Player/queue'
import ItemImage from './image'
import FavoriteIcon from './favorite-icon'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import navigationRef from '../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import { warmItemContext } from '../../../hooks/use-item-context'
import { useJellifyContext } from '../../../providers'
import { useStreamingQualityContext } from '../../../providers/Settings'

interface ItemRowProps {
	item: BaseItemDto
	navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	queueName: string
	onPress?: () => void
	circular?: boolean
}

/**
 * Displays an item as a row in a list.
 *
 * This is used in the Search and Library Tabs, as well as the Home and Discover Tabs
 * when viewing a full list of items from a section
 *
 * @param item - The item to display.
 * @param queueName - The name of the queue. Referenced in the {@link useLoadNewQueue} hook.
 * @param navigation - The navigation object.
 * @returns
 */
export default function ItemRow({
	item,
	navigation,
	onPress,
	circular,
}: ItemRowProps): React.JSX.Element {
	const useLoadNewQueue = useLoadQueueContext()

	const { api, user } = useJellifyContext()

	const streamingQuality = useStreamingQualityContext()

	const gestureCallback = () => {
		switch (item.Type) {
			case 'Audio': {
				useLoadNewQueue({
					track: item,
					tracklist: [item],
					index: 0,
					queue: 'Search',
					queuingType: QueuingType.FromSelection,
					startPlayback: true,
				})
				break
			}
			default: {
				break
			}
		}
	}

	const gesture = Gesture.Tap().onEnd(() => {
		'worklet'
		runOnJS(gestureCallback)()
	})

	return (
		<GestureDetector gesture={gesture}>
			<XStack
				alignContent='center'
				minHeight={'$7'}
				width={'100%'}
				onPressIn={() => warmItemContext(api, user, item, streamingQuality)}
				onLongPress={() => {
					navigationRef.navigate('Context', {
						item,
						navigation,
					})
				}}
				onPress={() => {
					if (onPress) {
						onPress()
						return
					}

					switch (item.Type) {
						case 'MusicArtist': {
							navigation?.navigate('Artist', { artist: item })
							break
						}

						case 'MusicAlbum': {
							navigation?.navigate('Album', { album: item })
							break
						}
					}
				}}
				paddingVertical={'$2'}
				paddingRight={'$2'}
			>
				<YStack marginHorizontal={'$3'} justifyContent='center'>
					<ItemImage
						item={item}
						height={'$12'}
						width={'$12'}
						circular={item.Type === 'MusicArtist' || circular}
					/>
				</YStack>

				<YStack alignContent='center' justifyContent='center' flex={4}>
					<Text bold lineBreakStrategyIOS='standard' numberOfLines={1}>
						{item.Name ?? ''}
					</Text>
					{item.Type === 'MusicArtist' && (
						<Text lineBreakStrategyIOS='standard' numberOfLines={1}>
							{`${item.ChildCount ?? 0} ${item.ChildCount === 1 ? 'Album' : 'Albums'}`}
						</Text>
					)}
					{(item.Type === 'Audio' || item.Type === 'MusicAlbum') && (
						<Text lineBreakStrategyIOS='standard' numberOfLines={1}>
							{item.AlbumArtist ?? 'Untitled Artist'}
						</Text>
					)}

					{item.Type === 'Playlist' && (
						<Text lineBreakStrategyIOS='standard' numberOfLines={1}>
							{item.Genres?.join(', ') ?? ''}
						</Text>
					)}
				</YStack>

				<XStack
					justifyContent='flex-end'
					alignItems='center'
					flex={['Audio', 'MusicAlbum'].includes(item.Type ?? '') ? 2 : 1}
				>
					<FavoriteIcon item={item} />
					{/* Runtime ticks for Songs */}
					{['Audio', 'MusicAlbum'].includes(item.Type ?? '') ? (
						<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
					) : ['Playlist'].includes(item.Type ?? '') ? (
						<Text
							color={'$borderColor'}
						>{`${item.ChildCount ?? 0} ${item.ChildCount === 1 ? 'Track' : 'Tracks'}`}</Text>
					) : null}

					{item.Type === 'Audio' || item.Type === 'MusicAlbum' ? (
						<Icon
							name='dots-horizontal'
							onPress={() => {
								navigationRef.navigate('Context', {
									item,
									navigation,
								})
							}}
						/>
					) : null}
				</XStack>
			</XStack>
		</GestureDetector>
	)
}
