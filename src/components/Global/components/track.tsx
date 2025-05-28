import { usePlayerContext } from '../../../providers/Player'
import React, { useRef, useState } from 'react'
import { getToken, getTokens, Theme, useTheme, XStack, YStack, Checkbox } from 'tamagui'
import { Text } from '../helpers/text'
import { RunTimeTicks } from '../helpers/time-codes'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../../components/types'
import { QueuingType } from '../../../enums/queuing-type'
import { Queue } from '../../../player/types/queue-item'
import FavoriteIcon from './favorite-icon'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { useNetworkContext } from '../../../providers/Network'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchMediaInfo } from '../../../api/queries/media'
import { useQueueContext } from '../../../providers/Player/queue'
import { fetchItem } from '../../../api/queries/item'
import { trigger } from 'react-native-haptic-feedback'
import { useJellifyContext } from '../../../providers'
import DownloadedIcon from './downloaded-icon'

export interface TrackProps {
	track: BaseItemDto
	navigation: NativeStackNavigationProp<StackParamList>
	tracklist?: BaseItemDto[] | undefined
	index: number
	queue: Queue
	showArtwork?: boolean | undefined
	onPress?: () => void | undefined
	onLongPress?: () => void | undefined
	isNested?: boolean | undefined
	invertedColors?: boolean | undefined
	prependElement?: React.JSX.Element | undefined
	showRemove?: boolean | undefined
	onRemove?: () => void | undefined
	// Multi-select props
	isMultiSelectMode?: boolean | undefined
	isSelected?: boolean | undefined
	onSelect?: (track: BaseItemDto) => void | undefined
	onStartMultiSelect?: (track: BaseItemDto) => void | undefined
}

export default function Track({
	track,
	tracklist,
	navigation,
	index,
	queue,
	showArtwork,
	onPress,
	onLongPress,
	isNested,
	invertedColors,
	showRemove,
	onRemove,
	// Multi-select props
	isMultiSelectMode,
	isSelected,
	onSelect,
	onStartMultiSelect,
}: TrackProps): React.JSX.Element {
	const theme = useTheme()
	const { api, user } = useJellifyContext()
	const { nowPlaying, useStartPlayback } = usePlayerContext()
	const { playQueue, useLoadNewQueue } = useQueueContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()

	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [isLongPressing, setIsLongPressing] = useState(false)

	const isPlaying = nowPlaying?.item.Id === track.Id

	const offlineAudio = downloadedTracks?.find((t) => t.item.Id === track.Id)
	const isDownloaded = offlineAudio?.item?.Id

	const isOffline = networkStatus === networkStatusTypes.DISCONNECTED

	// Fetch media info so it's available in the player
	const mediaInfo = useQuery({
		queryKey: [QueryKeys.MediaSources, track.Id!],
		queryFn: () => fetchMediaInfo(api, user, track),
		staleTime: Infinity,
		enabled: track.Type === 'Audio',
	})

	// Fetch album so it's available in the Details screen
	const { data: album } = useQuery({
		queryKey: [QueryKeys.MediaSources, track.Id!],
		queryFn: () => fetchItem(api, track.Id!),
	})

	const handlePressIn = () => {
		console.log('Track handlePressIn called', {
			isMultiSelectMode,
			hasOnStartMultiSelect: !!onStartMultiSelect,
		})
		if (!isMultiSelectMode && onStartMultiSelect) {
			console.log('Starting long press timer for multi-select')
			longPressTimer.current = setTimeout(() => {
				console.log('Long press timer fired, starting multi-select')
				trigger('impactMedium')
				onStartMultiSelect(track)
			}, 1500) // Reduced to 1.5 seconds for better UX
			setIsLongPressing(true)
		}
	}

	const handlePressOut = () => {
		console.log('Track handlePressOut called')
		if (longPressTimer.current) {
			console.log('Clearing long press timer')
			clearTimeout(longPressTimer.current)
			longPressTimer.current = null
		}
		setIsLongPressing(false)
	}

	const handlePress = () => {
		handlePressOut() // Clear timer if still running

		if (isMultiSelectMode && onSelect) {
			trigger('impactLight') // Light haptic feedback for selection
			onSelect(track)
		} else if (onPress) {
			onPress()
		} else {
			useLoadNewQueue.mutate(
				{
					track,
					index,
					tracklist: tracklist ?? playQueue.map((track) => track.item),
					queue,
					queuingType: QueuingType.FromSelection,
				},
				{
					onSuccess: () => useStartPlayback.mutate(),
				},
			)
		}
	}

	const handleLongPress = () => {
		handlePressOut() // Clear timer if still running

		// Only use built-in long press when multi-select is not available
		if (onLongPress) {
			onLongPress()
		} else if (!isMultiSelectMode && !onStartMultiSelect) {
			navigation.navigate('Details', {
				item: track,
				isNested: isNested,
			})
		}
	}

	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<XStack
				alignContent='center'
				alignItems='center'
				height={showArtwork ? '$6' : '$5'}
				flex={1}
				onPress={handlePress}
				onLongPress={onStartMultiSelect ? undefined : handleLongPress} // Disable built-in long press when multi-select is available
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				paddingVertical={'$2'}
				backgroundColor={
					isMultiSelectMode
						? isSelected
							? '$backgroundStrong'
							: '$backgroundSoft'
						: undefined
				}
				opacity={isLongPressing ? 0.5 : 1} // Add visual feedback during long press
			>
				{isMultiSelectMode && (
					<XStack alignItems='center' justifyContent='center' marginHorizontal={'$2'}>
						<Checkbox
							size='$4'
							checked={isSelected}
							onCheckedChange={() => onSelect?.(track)}
						>
							<Checkbox.Indicator>
								<Icon name='check' small />
							</Checkbox.Indicator>
						</Checkbox>
					</XStack>
				)}

				<XStack
					alignContent='center'
					justifyContent='center'
					flex={1}
					marginHorizontal={showArtwork ? '$4' : '$1'}
				>
					{showArtwork ? (
						<FastImage
							source={{
								uri: getImageApi(api!).getItemImageUrlById(track.AlbumId!),
							}}
							style={{
								width: getToken('$12'),
								height: getToken('$12'),
								borderRadius: getToken('$1'),
							}}
						/>
					) : (
						<Text color={isPlaying ? getTokens().color.telemagenta : theme.color}>
							{track.IndexNumber?.toString() ?? ''}
						</Text>
					)}
				</XStack>

				<YStack alignContent='center' justifyContent='flex-start' flex={6}>
					<Text
						bold
						color={
							isPlaying
								? getTokens().color.telemagenta
								: isOffline
									? isDownloaded
										? theme.color
										: '$purpleGray'
									: theme.color
						}
						lineBreakStrategyIOS='standard'
						numberOfLines={1}
					>
						{track.Name ?? 'Untitled Track'}
					</Text>

					{(showArtwork || (track.Artists && track.Artists.length > 1)) && (
						<Text
							lineBreakStrategyIOS='standard'
							numberOfLines={1}
							bold
							color={'$borderColor'}
						>
							{track.Artists?.join(', ') ?? ''}
						</Text>
					)}
				</YStack>

				<XStack
					alignItems='center'
					alignContent='center'
					justifyContent='flex-end'
					flex={4}
					marginRight={'$0'}
				>
					<DownloadedIcon item={track} />

					<FavoriteIcon item={track} />

					<RunTimeTicks
						props={{
							textAlign: 'center',
							flex: 3,
							alignSelf: 'center',
							marginVertical: 'auto',
						}}
					>
						{track.RunTimeTicks}
					</RunTimeTicks>

					{!isMultiSelectMode && (
						<Icon
							name={showRemove ? 'close' : 'dots-horizontal'}
							flex={3}
							onPress={() => {
								if (showRemove) {
									if (onRemove) onRemove()
								} else {
									navigation.navigate('Details', {
										item: track,
										isNested: isNested,
									})
								}
							}}
						/>
					)}
				</XStack>
			</XStack>
		</Theme>
	)
}
