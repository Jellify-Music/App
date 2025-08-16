import React, { useMemo, useCallback } from 'react'
import { getToken, Theme, useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import { RunTimeTicks } from '../helpers/time-codes'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { QueuingType } from '../../../enums/queuing-type'
import { Queue } from '../../../player/types/queue-item'
import FavoriteIcon from './favorite-icon'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { useNetworkContext } from '../../../providers/Network'
import { useLoadQueueContext, usePlayQueueContext } from '../../../providers/Player/queue'
import { useJellifyContext } from '../../../providers'
import DownloadedIcon from './downloaded-icon'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchMediaInfo } from '../../../api/queries/media'
import { useStreamingQualityContext } from '../../../providers/Settings'
import { getQualityParams } from '../../../utils/mappings'
import { useNowPlayingContext } from '../../../providers/Player'
import navigationRef from '../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'

export interface TrackProps {
	track: BaseItemDto
	navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
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
	testID?: string | undefined
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
	showRemove,
	onRemove,
}: TrackProps): React.JSX.Element {
	const theme = useTheme()

	const { api, user } = useJellifyContext()
	const nowPlaying = useNowPlayingContext()
	const playQueue = usePlayQueueContext()
	const useLoadNewQueue = useLoadQueueContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()
	const streamingQuality = useStreamingQualityContext()

	// Memoize expensive computations
	const isPlaying = useMemo(
		() => nowPlaying?.item.Id === track.Id,
		[nowPlaying?.item.Id, track.Id],
	)

	const offlineAudio = useMemo(
		() => downloadedTracks?.find((t) => t.item.Id === track.Id),
		[downloadedTracks, track.Id],
	)

	const isDownloaded = useMemo(() => offlineAudio?.item?.Id, [offlineAudio])

	const isOffline = useMemo(
		() => networkStatus === networkStatusTypes.DISCONNECTED,
		[networkStatus],
	)

	// Memoize image source to prevent recreation
	const imageSource = useMemo(
		() => ({
			uri:
				getImageApi(api!).getItemImageUrlById(
					track.AlbumId! || track.Id!,
					ImageType.Primary,
					{
						tag: track.ImageTags?.Primary,
					},
				) || '',
		}),
		[api, track.AlbumId, track.Id, track.ImageTags?.Primary],
	)

	// Memoize tracklist for queue loading
	const memoizedTracklist = useMemo(
		() => tracklist ?? playQueue.map((track) => track.item),
		[tracklist, playQueue],
	)

	// Memoize handlers to prevent recreation
	const handlePress = useCallback(() => {
		if (onPress) {
			onPress()
		} else {
			useLoadNewQueue({
				track,
				index,
				tracklist: memoizedTracklist,
				queue,
				queuingType: QueuingType.FromSelection,
				startPlayback: true,
			})
		}
	}, [onPress, track, index, memoizedTracklist, queue, useLoadNewQueue])

	const handleLongPress = useCallback(() => {
		if (onLongPress) {
			onLongPress()
		} else {
			navigationRef.navigate('Context', {
				item: track,
			})
		}
	}, [onLongPress, navigation, track, isNested])

	const handleIconPress = useCallback(() => {
		if (showRemove) {
			if (onRemove) onRemove()
		} else {
			navigationRef.navigate('Context', {
				item: track,
			})
		}
	}, [showRemove, onRemove, navigation, track, isNested])

	// Only fetch media info if needed (for streaming)
	useQuery({
		queryKey: [QueryKeys.MediaSources, streamingQuality, track.Id],
		queryFn: () => fetchMediaInfo(api, user, getQualityParams(streamingQuality), track),
		staleTime: Infinity, // Don't refetch media info unless the user changes the quality
		enabled: !isDownloaded, // Only fetch if not downloaded
	})

	// Memoize text color to prevent recalculation
	const textColor = useMemo(() => {
		if (isPlaying) return theme.primary.val
		if (isOffline) return isDownloaded ? theme.color : theme.neutral.val
		return theme.color
	}, [isPlaying, isOffline, isDownloaded, theme.primary.val, theme.color, theme.neutral.val])

	// Memoize artists text
	const artistsText = useMemo(() => track.Artists?.join(', ') ?? '', [track.Artists])

	// Memoize track name
	const trackName = useMemo(() => track.Name ?? 'Untitled Track', [track.Name])

	// Memoize index number
	const indexNumber = useMemo(() => track.IndexNumber?.toString() ?? '', [track.IndexNumber])

	// Memoize show artists condition
	const shouldShowArtists = useMemo(
		() => showArtwork || (track.Artists && track.Artists.length > 1),
		[showArtwork, track.Artists],
	)

	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<XStack
				alignContent='center'
				alignItems='center'
				height={showArtwork ? '$6' : '$5'}
				flex={1}
				testID={testID ?? undefined}
				onPress={handlePress}
				onLongPress={handleLongPress}
				paddingVertical={'$2'}
				justifyContent='center'
				marginRight={'$2'}
			>
				<XStack
					alignContent='center'
					justifyContent='center'
					marginHorizontal={showArtwork ? '$2' : '$1'}
				>
					{showArtwork ? (
						<FastImage
							key={`${track.Id}-${track.AlbumId || track.Id}`}
							source={imageSource}
							style={{
								width: getToken('$12'),
								height: getToken('$12'),
								borderRadius: getToken('$1'),
							}}
						/>
					) : (
						<Text
							key={`${track.Id}-number`}
							color={textColor}
							width={getToken('$12')}
							textAlign='center'
						>
							{indexNumber}
						</Text>
					)}
				</XStack>

				<YStack alignContent='center' justifyContent='flex-start' flex={6}>
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
						>
							{artistsText}
						</Text>
					)}
				</YStack>

				<DownloadedIcon item={track} />

				<FavoriteIcon item={track} />

				<RunTimeTicks
					key={`${track.Id}-runtime`}
					props={{
						style: {
							textAlign: 'center',
							flex: 1.5,
							alignSelf: 'center',
						},
					}}
				>
					{track.RunTimeTicks}
				</RunTimeTicks>

				<Icon
					name={showRemove ? 'close' : 'dots-horizontal'}
					flex={1}
					onPress={handleIconPress}
				/>
			</XStack>
		</Theme>
	)
}
