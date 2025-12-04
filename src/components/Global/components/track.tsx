import React, { useState } from 'react'
import { getToken, Theme, useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import { RunTimeTicks } from '../helpers/time-codes'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { Queue } from '../../../player/types/queue-item'
import FavoriteIcon from './favorite-icon'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { useNetworkStatus } from '../../../stores/network'
import DownloadedIcon from './downloaded-icon'
import navigationRef from '../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../screens/types'
import ItemImage from './image'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useAddToQueue, useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import { useDownloadedTrack } from '../../../api/queries/download'
import SwipeableRow from './SwipeableRow'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import { buildSwipeConfig } from '../helpers/swipe-actions'
import { useIsFavorite } from '../../../api/queries/user-data'
import { useApi } from '../../../stores'
import { useCurrentTrack, usePlayQueue } from '../../../stores/player/queue'
import { useAddFavorite, useRemoveFavorite } from '../../../api/mutations/favorite'
import { StackActions } from '@react-navigation/native'
import { useSwipeableRowContext } from './swipeable-row-context'
import { useHideRunTimesSetting } from '../../../stores/settings/app'
import useStreamedMediaInfo from '../../../api/queries/media'

export interface TrackProps {
	track: BaseItemDto
	navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	tracklist?: BaseItemDto[] | undefined
	index: number
	queue: Queue
	showArtwork?: boolean | undefined
	onPress?: () => Promise<void> | undefined
	onLongPress?: () => void | undefined
	isNested?: boolean | undefined
	invertedColors?: boolean | undefined
	testID?: string | undefined
	editing?: boolean | undefined
}

export default function Track({
	track,
	navigation,
	tracklist,
	index,
	queue,
	showArtwork,
	onPress,
	onLongPress,
	testID,
	isNested,
	invertedColors,
	editing,
}: TrackProps): React.JSX.Element {
	const theme = useTheme()
	const [artworkAreaWidth, setArtworkAreaWidth] = useState(0)

	const api = useApi()

	const deviceProfile = useStreamingDeviceProfile()

	const [hideRunTimes] = useHideRunTimesSetting()

	const nowPlaying = useCurrentTrack()
	const playQueue = usePlayQueue()
	const loadNewQueue = useLoadNewQueue()
	const addToQueue = useAddToQueue()
	const [networkStatus] = useNetworkStatus()

	const { data: mediaInfo } = useStreamedMediaInfo(track.Id)

	const offlineAudio = useDownloadedTrack(track.Id)

	const { mutate: addFavorite } = useAddFavorite()
	const { mutate: removeFavorite } = useRemoveFavorite()
	const { data: isFavoriteTrack } = useIsFavorite(track)
	const leftSettings = useSwipeSettingsStore((s) => s.left)
	const rightSettings = useSwipeSettingsStore((s) => s.right)

	// Memoize expensive computations
	const isPlaying = nowPlaying?.item.Id === track.Id

	const isOffline = networkStatus === networkStatusTypes.DISCONNECTED

	// Memoize tracklist for queue loading
	const memoizedTracklist = tracklist ?? playQueue?.map((track) => track.item) ?? []

	// Memoize handlers to prevent recreation
	const handlePress = async () => {
		if (onPress) {
			await onPress()
		} else {
			loadNewQueue({
				api,
				deviceProfile,
				networkStatus,
				track,
				index,
				tracklist: memoizedTracklist,
				queue,
				queuingType: QueuingType.FromSelection,
				startPlayback: true,
			})
		}
	}

	const handleLongPress = () => {
		if (onLongPress) {
			onLongPress()
		} else {
			navigationRef.navigate('Context', {
				item: track,
				navigation,
				streamingMediaSourceInfo: mediaInfo?.MediaSources
					? mediaInfo!.MediaSources![0]
					: undefined,
				downloadedMediaSourceInfo: offlineAudio?.mediaSourceInfo,
			})
		}
	}

	const handleIconPress = () => {
		navigationRef.navigate('Context', {
			item: track,
			navigation,
			streamingMediaSourceInfo: mediaInfo?.MediaSources
				? mediaInfo!.MediaSources![0]
				: undefined,
			downloadedMediaSourceInfo: offlineAudio?.mediaSourceInfo,
		})
	}

	// Memoize text color to prevent recalculation
	const textColor = isPlaying
		? theme.primary.val
		: isOffline
			? offlineAudio
				? theme.color
				: theme.neutral.val
			: theme.color

	// Memoize artists text
	const artistsText = track.Artists?.join(', ') ?? ''

	// Memoize track name
	const trackName = track.Name ?? 'Untitled Track'

	// Memoize index number
	const indexNumber = track.IndexNumber?.toString() ?? ''

	// Memoize show artists condition
	const shouldShowArtists = showArtwork || (track.Artists && track.Artists.length > 1)

	const swipeHandlers = {
		addToQueue: async () => {
			console.info('Running add to queue swipe action')
			await addToQueue({
				api,
				deviceProfile,
				networkStatus,
				tracks: [track],
				queuingType: QueuingType.DirectlyQueued,
			})
		},
		toggleFavorite: () => {
			console.info(`Running ${isFavoriteTrack ? 'Remove' : 'Add'} favorite swipe action`)
			if (isFavoriteTrack) removeFavorite({ item: track })
			else addFavorite({ item: track })
		},
		addToPlaylist: () => {
			console.info('Running add to playlist swipe handler')
			navigationRef.dispatch(StackActions.push('AddToPlaylist', { track }))
		},
	}

	const swipeConfig = buildSwipeConfig({
		left: leftSettings,
		right: rightSettings,
		handlers: swipeHandlers,
	})

	const runtimeComponent = hideRunTimes ? (
		<></>
	) : (
		<RunTimeTicks
			key={`${track.Id}-runtime`}
			props={{
				style: {
					textAlign: 'right',
					minWidth: getToken('$10'),
					alignSelf: 'center',
				},
			}}
		>
			{track.RunTimeTicks}
		</RunTimeTicks>
	)

	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<SwipeableRow
				disabled={isNested === true}
				{...swipeConfig}
				onLongPress={handleLongPress}
				onPress={handlePress}
			>
				<XStack
					alignContent='center'
					alignItems='center'
					flex={1}
					testID={testID ?? undefined}
					paddingVertical={'$2'}
					justifyContent='flex-start'
					paddingRight={'$2'}
					animation={'quick'}
					pressStyle={{ opacity: 0.5 }}
					backgroundColor={'$background'}
				>
					<XStack
						alignContent='center'
						justifyContent='center'
						marginHorizontal={showArtwork ? '$2' : '$1'}
						onLayout={(e) => setArtworkAreaWidth(e.nativeEvent.layout.width)}
					>
						{showArtwork ? (
							<HideableArtwork>
								<ItemImage item={track} width={'$12'} height={'$12'} />
							</HideableArtwork>
						) : (
							<Text
								key={`${track.Id}-number`}
								color={textColor}
								width={getToken('$12')}
								textAlign='center'
								fontVariant={['tabular-nums']}
							>
								{indexNumber}
							</Text>
						)}
					</XStack>

					<SlidingTextArea leftGapWidth={artworkAreaWidth} hasArtwork={!!showArtwork}>
						<YStack alignItems='flex-start' justifyContent='center' flex={1}>
							<Text
								key={`${track.Id}-name`}
								bold
								color={textColor}
								lineBreakStrategyIOS='standard'
								numberOfLines={1}
							>
								{trackName}
							</Text>

							{shouldShowArtists && (
								<Text
									key={`${track.Id}-artists`}
									lineBreakStrategyIOS='standard'
									numberOfLines={1}
									color={'$borderColor'}
								>
									{artistsText}
								</Text>
							)}
						</YStack>
					</SlidingTextArea>

					<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap='$1'>
						<DownloadedIcon item={track} />
						<FavoriteIcon item={track} />
						{runtimeComponent}
						{!editing && <Icon name={'dots-horizontal'} onPress={handleIconPress} />}
					</XStack>
				</XStack>
			</SwipeableRow>
		</Theme>
	)
}

function HideableArtwork({ children }: { children: React.ReactNode }) {
	const { tx } = useSwipeableRowContext()
	// Hide artwork as soon as swiping starts (any non-zero tx)
	const style = useAnimatedStyle(() => ({ opacity: tx.value === 0 ? 1 : 0 }))
	return <Animated.View style={style}>{children}</Animated.View>
}

function SlidingTextArea({
	leftGapWidth,
	hasArtwork,
	children,
}: {
	leftGapWidth: number
	hasArtwork: boolean
	children: React.ReactNode
}) {
	const { tx, rightWidth } = useSwipeableRowContext()
	const style = useAnimatedStyle(() => {
		const t = tx.value
		let offset = 0
		if (t > 0 && hasArtwork) {
			// Swiping right: row content moves right; pull text left up to artwork width to fill the gap
			offset = -Math.min(t, Math.max(0, leftGapWidth))
		} else if (t < 0) {
			// Swiping left: row content moves left; push text right a bit to keep it visible
			const compensate = Math.min(-t, Math.max(0, rightWidth))
			offset = compensate * 0.7
		}
		return { transform: [{ translateX: offset }] }
	})
	return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>
}
