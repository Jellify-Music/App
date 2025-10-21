import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { RunTimeTicks } from '../helpers/time-codes'
import ItemImage from './image'
import FavoriteIcon from './favorite-icon'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import navigationRef from '../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { useJellifyContext } from '../../../providers'
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import useItemContext from '../../../hooks/use-item-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useCallback } from 'react'

interface ItemRowProps {
	item: BaseItemDto
	queueName?: string
	circular?: boolean
	onPress?: () => void
	navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
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
	circular,
	navigation,
	onPress,
}: ItemRowProps): React.JSX.Element {
	const { api } = useJellifyContext()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const loadNewQueue = useLoadNewQueue()

	const warmContext = useItemContext()

	const onPressIn = useCallback(() => warmContext(item), [warmContext, item])

	const onLongPress = useCallback(
		() =>
			navigationRef.navigate('Context', {
				item,
				navigation,
			}),
		[navigationRef, navigation, item],
	)

	const onPressCallback = useCallback(() => {
		if (onPress) onPress()
		else
			switch (item.Type) {
				case 'Audio': {
					loadNewQueue({
						api,
						networkStatus,
						deviceProfile,
						track: item,
						tracklist: [item],
						index: 0,
						queue: 'Search',
						queuingType: QueuingType.FromSelection,
						startPlayback: true,
					})
					break
				}
				case 'MusicArtist': {
					navigation?.navigate('Artist', { artist: item })
					break
				}

				case 'MusicAlbum': {
					navigation?.navigate('Album', { album: item })
					break
				}

				case 'Playlist': {
					navigation?.navigate('Playlist', { playlist: item, canEdit: true })
					break
				}
				default: {
					break
				}
			}
	}, [loadNewQueue, item, navigation])

	const renderRunTime = item.Type === BaseItemKind.Audio

	return (
		<XStack
			alignContent='center'
			minHeight={'$7'}
			width={'100%'}
			onPressIn={onPressIn}
			onPress={onPressCallback}
			onLongPress={onLongPress}
			animation={'quick'}
			pressStyle={{ opacity: 0.5 }}
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

			<ItemRowDetails item={item} />

			<XStack justifyContent='flex-end' alignItems='center' flex={2}>
				{renderRunTime ? (
					<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
				) : ['Playlist'].includes(item.Type ?? '') ? (
					<Text
						color={'$borderColor'}
					>{`${item.ChildCount ?? 0} ${item.ChildCount === 1 ? 'Track' : 'Tracks'}`}</Text>
				) : null}
				<FavoriteIcon item={item} />

				{item.Type === 'Audio' || item.Type === 'MusicAlbum' ? (
					<Icon name='dots-horizontal' onPress={onLongPress} />
				) : null}
			</XStack>
		</XStack>
	)
}

function ItemRowDetails({ item }: { item: BaseItemDto }): React.JSX.Element {
	const route = useRoute<RouteProp<BaseStackParamList>>()

	const shouldRenderArtistName =
		item.Type === 'Audio' || (item.Type === 'MusicAlbum' && route.name !== 'Artist')

	const shouldRenderProductionYear = item.Type === 'MusicAlbum' && route.name === 'Artist'

	const shouldRenderGenres = item.Type === 'Playlist' || item.Type === BaseItemKind.MusicArtist

	return (
		<YStack alignContent='center' justifyContent='center' flex={5}>
			<Text bold lineBreakStrategyIOS='standard' numberOfLines={1}>
				{item.Name ?? ''}
			</Text>

			{shouldRenderArtistName && (
				<Text color={'$borderColor'} lineBreakStrategyIOS='standard' numberOfLines={1}>
					{item.AlbumArtist ?? 'Untitled Artist'}
				</Text>
			)}

			{shouldRenderProductionYear && (
				<XStack gap='$2'>
					<Text color={'$borderColor'} lineBreakStrategyIOS='standard' numberOfLines={1}>
						{item.ProductionYear?.toString() ?? 'Unknown Year'}
					</Text>

					<Text color={'$borderColor'}>•</Text>

					<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
				</XStack>
			)}

			{shouldRenderGenres && (
				<Text color={'$borderColor'} lineBreakStrategyIOS='standard' numberOfLines={1}>
					{item.Genres?.join(', ') ?? ''}
				</Text>
			)}
		</YStack>
	)
}
