import React, { useMemo, useCallback, useEffect } from 'react'
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
import useItemContext from '../../../hooks/use-item-context'
import { useNowPlaying, useQueue } from '../../../providers/Player/hooks/queries'
import { useLoadNewQueue } from '../../../providers/Player/hooks/mutations'
import { useJellifyContext } from '../../../providers'
import useStreamingDeviceProfile from '../../../stores/device-profile'
import useStreamedMediaInfo from '../../../api/queries/media'
import { useDownloadedTrack } from '../../../api/queries/download'

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

	const { api } = useJellifyContext()

	const deviceProfile = useStreamingDeviceProfile()

	const { data: nowPlaying } = useNowPlaying()
	const { data: playQueue } = useQueue()
	const { mutate: loadNewQueue } = useLoadNewQueue()
	const [networkStatus] = useNetworkStatus()

	const { data: mediaInfo } = useStreamedMediaInfo(track.Id)

	const offlineAudio = useDownloadedTrack(track.Id)

	// Memoize expensive computations
	const isPlaying = useMemo(
		() => nowPlaying?.item.Id === track.Id,
		[nowPlaying?.item.Id, track.Id],
	)

	const isOffline = useMemo(
		() => networkStatus === networkStatusTypes.DISCONNECTED,
		[networkStatus],
	)

	// Memoize tracklist for queue loading
	const memoizedTracklist = useMemo(
		() => tracklist ?? playQueue?.map((track) => track.item) ?? [],
		[tracklist, playQueue],
	)

	// Memoize handlers to prevent recreation
	const handlePress = useCallback(() => {
		if (onPress) {
			onPress()
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
	}, [onPress, track, index, memoizedTracklist, queue, useLoadNewQueue])

	const handleLongPress = useCallback(() => {
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
	}, [onLongPress, track, isNested, mediaInfo?.MediaSources, offlineAudio])

	const handleIconPress = useCallback(() => {
		if (showRemove) {
			if (onRemove) onRemove()
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
	}, [showRemove, onRemove, track, isNested, mediaInfo?.MediaSources, offlineAudio])

	// Memoize text color to prevent recalculation
	const textColor = useMemo(() => {
		if (isPlaying) return theme.primary.val
		if (isOffline) return offlineAudio ? theme.color : theme.neutral.val
		return theme.color
	}, [isPlaying, isOffline, offlineAudio, theme.primary.val, theme.color, theme.neutral.val])

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
				animation={'quick'}
				pressStyle={{ opacity: 0.5 }}
			>
				<XStack
					alignContent='center'
					justifyContent='center'
					marginHorizontal={showArtwork ? '$2' : '$1'}
				>
					{showArtwork ? (
						<ItemImage item={track} width={'$12'} height={'$12'} />
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
							color={'$borderColor'}
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
