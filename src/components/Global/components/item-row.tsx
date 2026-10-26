import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { XStack, YStack, getToken, SizableText } from 'tamagui'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { RunTimeTicks } from '../helpers/time-codes'
import ItemImage from './image'
import FavoriteIcon from './favorite-icon'
import navigationRef from '../../../screens/navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import useItemContext from '../../../hooks/use-item-context'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import Animated, {
	SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated'
import { useSwipeableRowContext } from './SwipeableRow/context'
import SwipeableRow from './SwipeableRow'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import { buildSwipeConfig } from '../helpers/swipe-actions'
import { useIsFavorite } from '../../../api/queries/user-data'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { useHideRunTimesSetting } from '../../../stores/settings/app'
import { Queue } from '../../../services/types/queue-item'
import { formatArtistName } from '../../../utils/formatting/artist-names'
import { addToQueue, loadNewQueue } from '../../../player/queuing'

interface ItemRowProps {
	item: BaseItemDto
	circular?: boolean
	onPress?: () => void
	onLongPress?: () => void
	queueName?: Queue
	sortingByReleasedDate?: boolean | undefined
	testID?: string
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
function ItemRow({
	item,
	circular,
	onPress,
	onLongPress,
	queueName,
	sortingByReleasedDate,
	testID,
}: ItemRowProps): React.JSX.Element {
	const artworkAreaWidth = useSharedValue(0)

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const { mutate: addFavorite } = useAddFavorite()
	const { mutate: removeFavorite } = useRemoveFavorite()
	const [hideRunTimes] = useHideRunTimesSetting()

	const warmContext = useItemContext()
	const { data: isFavorite } = useIsFavorite(item)

	const onPressIn = () => warmContext(item)

	const handleLongPress = () => {
		if (onLongPress) onLongPress()
		else
			navigationRef.navigate('Context', {
				item,
				navigation,
			})
	}

	const onPressCallback = async () => {
		if (onPress) await onPress()
		else
			switch (item.Type) {
				case 'Audio': {
					loadNewQueue({
						track: item,
						tracklist: [item],
						index: 0,
						queue: queueName ?? 'Search',
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
	}

	const renderRunTime = item.Type === BaseItemKind.Audio && !hideRunTimes

	const isAudio = item.Type === 'Audio'

	const playlistTrackCount =
		item.Type === 'Playlist' ? (item.SongCount ?? item.ChildCount ?? 0) : undefined

	const leftSettings = useSwipeSettingsStore.getState().left
	const rightSettings = useSwipeSettingsStore.getState().right

	const swipeHandlers = () => ({
		addToQueue: async () =>
			await addToQueue({
				tracks: [item],
				queuingType: QueuingType.PlayLater,
			}),
		toggleFavorite: () => (isFavorite ? removeFavorite({ item }) : addFavorite({ item })),
		addToPlaylist: () => navigationRef.navigate('AddToPlaylist', { tracks: [item] }),
		playNext: async () =>
			await addToQueue({
				tracks: [item],
				queuingType: QueuingType.PlayNext,
			}),
	})

	const swipeConfig = isAudio
		? buildSwipeConfig({
				left: leftSettings,
				right: rightSettings,
				handlers: swipeHandlers(),
			})
		: {}

	const handleArtworkLayout = (event: LayoutChangeEvent) => {
		const { width } = event.nativeEvent.layout
		artworkAreaWidth.value = width
	}

	// The resting value is required - without it, a cancelled press animates opacity to null and crashes Reanimated
	const pressOpacity = '1 press:0.5'
	if (!isAudio) {
		return (
			<XStack
				alignContent='center'
				width={'100%'}
				transition={'quick'}
				opacity={pressOpacity}
				paddingVertical='2'
				backgroundColor='background'
				testID={testID ?? (item.Id ? `item-row-${item.Id}` : undefined)}
				onPressIn={onPressIn}
				onPress={onPressCallback}
				onLongPress={handleLongPress}
			>
				<HideableArtwork item={item} circular={circular} onLayout={handleArtworkLayout} />
				<SlidingTextArea leftGapWidth={artworkAreaWidth}>
					<ItemRowDetails item={item} sortingByReleasedDate={sortingByReleasedDate} />
				</SlidingTextArea>

				<XStack justifyContent='flex-end' alignItems='center' flexShrink={1}>
					{renderRunTime ? (
						<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
					) : item.Type === 'Playlist' ? (
						<SizableText fontSize='2' color={'borderColor'}>
							{`${playlistTrackCount ?? 0} ${playlistTrackCount === 1 ? 'Track' : 'Tracks'}`}
						</SizableText>
					) : null}
					<FavoriteIcon item={item} />

					{item.Type === 'Audio' || item.Type === 'MusicAlbum' ? (
						<Icon name='dots-horizontal' onPress={onLongPress} />
					) : null}
				</XStack>
			</XStack>
		)
	}
	return (
		<SwipeableRow
			id={item.Id}
			disabled={!isAudio}
			{...swipeConfig}
			onLongPress={handleLongPress}
			onPress={onPressCallback}
		>
			<XStack
				alignContent='center'
				width={'100%'}
				transition={'quick'}
				opacity={pressOpacity}
				paddingVertical='2'
				backgroundColor='background'
				testID={testID ?? (item.Id ? `item-row-${item.Id}` : undefined)}
				onPressIn={onPressIn}
				onPress={onPressCallback}
				onLongPress={handleLongPress}
			>
				<HideableArtwork item={item} circular={circular} onLayout={handleArtworkLayout} />
				<SlidingTextArea leftGapWidth={artworkAreaWidth}>
					<ItemRowDetails item={item} />
				</SlidingTextArea>

				<XStack justifyContent='flex-end' alignItems='center' flexShrink={1}>
					{renderRunTime ? (
						<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
					) : (
						item.Type === 'Playlist' && (
							<SizableText fontSize='2' color={'borderColor'}>
								{`${playlistTrackCount ?? 0} ${playlistTrackCount === 1 ? 'Track' : 'Tracks'}`}
							</SizableText>
						)
					)}
					<FavoriteIcon item={item} />

					<Icon name='dots-horizontal' onPress={onLongPress} />
				</XStack>
			</XStack>
		</SwipeableRow>
	)
}

function ItemRowDetails({
	item,
	sortingByReleasedDate,
}: {
	item: BaseItemDto
	sortingByReleasedDate?: boolean | undefined
}): React.JSX.Element {
	const route = useRoute<RouteProp<BaseStackParamList>>()

	const shouldRenderArtistName =
		item.Type === 'Audio' || (item.Type === 'MusicAlbum' && !route.name.includes('Artist'))

	const shouldRenderProductionYear = item.Type === 'MusicAlbum' && route.name.includes('Artist')

	const shouldRenderGenres = item.Type === 'Playlist' || item.Type === BaseItemKind.MusicArtist

	return (
		<YStack alignContent='center' justifyContent='center' flexGrow={1}>
			<SizableText
				fontSize='2'
				fontWeight='6'
				lineBreakStrategyIOS='standard'
				numberOfLines={1}
			>
				{item.Name ?? ''}
			</SizableText>

			{shouldRenderArtistName && (
				<SizableText
					color={'borderColor'}
					lineBreakStrategyIOS='standard'
					numberOfLines={1}
					fontSize='2'
				>
					{formatArtistName(
						item.AlbumArtist,
						sortingByReleasedDate ? item.ProductionYear?.toString() : undefined,
					)}
				</SizableText>
			)}

			{shouldRenderProductionYear && (
				<XStack gap='2'>
					<SizableText
						fontSize='2'
						color={'borderColor'}
						lineBreakStrategyIOS='standard'
						numberOfLines={1}
					>
						{item.ProductionYear?.toString() ?? 'Unknown Year'}
					</SizableText>

					<SizableText fontSize='2' color={'borderColor'}>
						•
					</SizableText>

					<RunTimeTicks>{item.RunTimeTicks}</RunTimeTicks>
				</XStack>
			)}

			{shouldRenderGenres && item.Genres && (
				<SizableText
					fontSize='2'
					color={'borderColor'}
					lineBreakStrategyIOS='standard'
					numberOfLines={1}
				>
					{item.Genres?.join(', ') ?? ''}
				</SizableText>
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
		opacity: withTiming(tx.value === 0 ? 1 : 0),
	}))
	return (
		<Animated.View style={style} onLayout={onLayout}>
			<XStack marginRight='2' marginVertical={'auto'} alignItems='center'>
				<ItemImage
					item={item}
					height={'4'}
					width={'4'}
					elevate
					circular={item.Type === 'MusicArtist' || circular}
					imageOptions={{ maxWidth: 140, maxHeight: 140, quality: 90 }}
				/>
			</XStack>
		</Animated.View>
	)
}

function SlidingTextArea({
	leftGapWidth,
	children,
}: {
	leftGapWidth: SharedValue<number>
	children: React.ReactNode
}): React.JSX.Element {
	const { tx, rightWidth } = useSwipeableRowContext()
	const tokenValue = getToken('2', 'space')
	const spacingValue = typeof tokenValue === 'number' ? tokenValue : parseFloat(`${tokenValue}`)
	const quickActionBuffer = Number.isFinite(spacingValue) ? spacingValue : 8
	const style = useAnimatedStyle(() => {
		const t = tx.value
		let offset = 0
		if (t > 0 && leftGapWidth.get() > 0) {
			offset = -Math.min(t, leftGapWidth.get())
		} else if (t < 0) {
			const rightSpace = Math.max(0, rightWidth)
			const compensate = Math.min(-t, rightSpace)
			const progress = rightSpace > 0 ? compensate / rightSpace : 1
			offset = compensate * 0.7 + quickActionBuffer * progress
		}
		return {
			transform: [
				{
					translateX: withSpring(offset),
				},
			],
		}
	})
	const paddingRightValue = Number.isFinite(spacingValue) ? spacingValue : 8
	return (
		<Animated.View style={[{ flex: 5, paddingRight: paddingRightValue }, style]}>
			{children}
		</Animated.View>
	)
}

export default ItemRow
