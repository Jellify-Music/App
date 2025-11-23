import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { XStack, YStack, getToken } from 'tamagui'
import { Text } from '../helpers/text'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { RunTimeTicks } from '../helpers/time-codes'
import ItemImage from './image'
import FavoriteIcon from './favorite-icon'
import navigationRef from '../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import { useAddToQueue, useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { useNetworkStatus } from '../../../stores/network'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import useItemContext from '../../../hooks/use-item-context'
import { RouteProp, useRoute } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSwipeableRowContext } from './swipeable-row-context'
import SwipeableRow from './SwipeableRow'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import { buildSwipeConfig } from '../helpers/swipe-actions'
import { useIsFavorite } from '../../../api/queries/user-data'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useApi } from '../../../stores'
import { useHideRunTimesSetting } from '../../../stores/settings/app'

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
	queueName,
}: ItemRowProps): React.JSX.Element {
	const [artworkAreaWidth, setArtworkAreaWidth] = useState(0)

	const api = useApi()

	const [networkStatus] = useNetworkStatus()

	const deviceProfile = useStreamingDeviceProfile()

	const loadNewQueue = useLoadNewQueue()
	const addToQueue = useAddToQueue()
	const { mutate: addFavorite } = useAddFavorite()
	const { mutate: removeFavorite } = useRemoveFavorite()
	const [hideRunTimes] = useHideRunTimesSetting()

	const warmContext = useItemContext()
	const { data: isFavorite } = useIsFavorite(item)

	const onPressIn = useCallback(() => warmContext(item), [warmContext, item])

	const onLongPress = useCallback(
		() =>
			navigationRef.navigate('Context', {
				item,
				navigation,
			}),
		[navigationRef, navigation, item],
	)

	const onPressCallback = useCallback(async () => {
		if (onPress) await onPress()
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

	const renderRunTime = item.Type === BaseItemKind.Audio && !hideRunTimes

	const isAudio = item.Type === 'Audio'

	const playlistTrackCount =
		item.Type === 'Playlist' ? (item.SongCount ?? item.ChildCount ?? 0) : undefined

	const leftSettings = useSwipeSettingsStore((s) => s.left)
	const rightSettings = useSwipeSettingsStore((s) => s.right)

	const swipeHandlers = useCallback(
		() => ({
			addToQueue: async () =>
				await addToQueue({
					api,
					deviceProfile,
					networkStatus,
					tracks: [item],
					queuingType: QueuingType.DirectlyQueued,
				}),
			toggleFavorite: () => (isFavorite ? removeFavorite({ item }) : addFavorite({ item })),
			addToPlaylist: () => navigationRef.navigate('AddToPlaylist', { track: item }),
		}),
		[
			addToQueue,
			api,
			deviceProfile,
			networkStatus,
			item,
			addFavorite,
			removeFavorite,
			isFavorite,
		],
	)

	const swipeConfig = isAudio
		? buildSwipeConfig({ left: leftSettings, right: rightSettings, handlers: swipeHandlers() })
		: {}

	return (
		<SwipeableRow
			disabled={!isAudio}
			{...swipeConfig}
			onLongPress={onLongPress}
			onPress={onPressCallback}
		>
			<XStack
				alignContent='center'
				minHeight={'$7'}
				width={'100%'}
				testID={item.Id ? `item-row-${item.Id}` : undefined}
				onPressIn={onPressIn}
				onPress={onPressCallback}
				onLongPress={onLongPress}
				animation={'quick'}
				pressStyle={{ opacity: 0.5 }}
				paddingVertical={'$2'}
				paddingRight={'$2'}
				paddingLeft={'$1'}
				backgroundColor={'$background'}
				borderRadius={'$2'}
			>
				<HideableArtwork
					item={item}
					circular={circular}
					onLayout={(e) => setArtworkAreaWidth(e.nativeEvent.layout.width)}
				/>
				<SlidingTextArea leftGapWidth={artworkAreaWidth}>
					<ItemRowDetails item={item} />
				</SlidingTextArea>

				<XStack justifyContent='flex-end' alignItems='center' flex={2}>
					{renderRunTime ? (
						<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
					) : item.Type === 'Playlist' ? (
						<Text color={'$borderColor'}>
							{`${playlistTrackCount ?? 0} ${playlistTrackCount === 1 ? 'Track' : 'Tracks'}`}
						</Text>
					) : null}
					<FavoriteIcon item={item} />

					{item.Type === 'Audio' || item.Type === 'MusicAlbum' ? (
						<Icon name='dots-horizontal' onPress={onLongPress} />
					) : null}
				</XStack>
			</XStack>
		</SwipeableRow>
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

			{shouldRenderGenres && item.Genres && (
				<Text color={'$borderColor'} lineBreakStrategyIOS='standard' numberOfLines={1}>
					{item.Genres?.join(', ') ?? ''}
				</Text>
			)}
		</YStack>
	)
}

// Artwork wrapper that fades out when the quick-action menu is open
function HideableArtwork({
	item,
	circular,
	onLayout,
}: {
	item: BaseItemDto
	circular?: boolean
	onLayout?: (event: LayoutChangeEvent) => void
}): React.JSX.Element {
	const { tx } = useSwipeableRowContext()
	// Hide artwork as soon as swiping starts (any non-zero tx)
	const style = useAnimatedStyle(() => ({
		opacity: tx.value === 0 ? 1 : 0,
	}))
	return (
		<Animated.View style={style} onLayout={onLayout}>
			<YStack marginHorizontal={'$3'} justifyContent='center'>
				<ItemImage
					item={item}
					height={'$12'}
					width={'$12'}
					circular={item.Type === 'MusicArtist' || circular}
				/>
			</YStack>
		</Animated.View>
	)
}

function SlidingTextArea({
	leftGapWidth,
	children,
}: {
	leftGapWidth: number
	children: React.ReactNode
}): React.JSX.Element {
	const { tx, rightWidth } = useSwipeableRowContext()
	const tokenValue = getToken('$2', 'space')
	const spacingValue = typeof tokenValue === 'number' ? tokenValue : parseFloat(`${tokenValue}`)
	const quickActionBuffer = Number.isFinite(spacingValue) ? spacingValue : 8
	const style = useAnimatedStyle(() => {
		const t = tx.value
		let offset = 0
		if (t > 0 && leftGapWidth > 0) {
			offset = -Math.min(t, leftGapWidth)
		} else if (t < 0) {
			const rightSpace = Math.max(0, rightWidth)
			const compensate = Math.min(-t, rightSpace)
			const progress = rightSpace > 0 ? compensate / rightSpace : 1
			offset = compensate * 0.7 + quickActionBuffer * progress
		}
		return { transform: [{ translateX: offset }] }
	})
	const paddingRightValue = Number.isFinite(spacingValue) ? spacingValue : 8
	return (
		<Animated.View style={[{ flex: 5, paddingRight: paddingRightValue }, style]}>
			{children}
		</Animated.View>
	)
}
