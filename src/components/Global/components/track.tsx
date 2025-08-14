import React, { useEffect } from 'react'
import { getToken, Theme, useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import { RunTimeTicks } from '../helpers/time-codes'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList, RootStackParamList } from '../../../screens/types'
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
import { useNavigation } from '@react-navigation/native'

export interface TrackProps {
	track: BaseItemDto
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

	const stackNavigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { api, user } = useJellifyContext()
	const nowPlaying = useNowPlayingContext()
	const playQueue = usePlayQueueContext()
	const useLoadNewQueue = useLoadQueueContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()
	const streamingQuality = useStreamingQualityContext()

	const isPlaying = nowPlaying?.item.Id === track.Id

	const offlineAudio = downloadedTracks?.find((t) => t.item.Id === track.Id)
	const isDownloaded = offlineAudio?.item?.Id

	const isOffline = networkStatus === networkStatusTypes.DISCONNECTED

	useQuery({
		queryKey: [QueryKeys.MediaSources, streamingQuality, track.Id],
		queryFn: () => fetchMediaInfo(api, user, getQualityParams(streamingQuality), track),
		staleTime: Infinity, // Don't refetch media info unless the user changes the quality
	})

	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<XStack
				alignContent='center'
				alignItems='center'
				height={showArtwork ? '$6' : '$5'}
				flex={1}
				testID={testID ?? undefined}
				onPress={() => {
					if (onPress) {
						onPress()
					} else {
						useLoadNewQueue({
							track,
							index,
							tracklist: tracklist ?? playQueue.map((track) => track.item),
							queue,
							queuingType: QueuingType.FromSelection,
							startPlayback: true,
						})
					}
				}}
				onLongPress={
					onLongPress
						? () => onLongPress()
						: () => {
								rootNavigation.navigate('Context', {
									item: track,
								})
							}
				}
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
							source={{
								uri:
									getImageApi(api!).getItemImageUrlById(
										track.AlbumId! || track.Id!,
										ImageType.Primary,
										{
											tag: track.ImageTags?.Primary,
										},
									) || '',
							}}
							style={{
								width: getToken('$12'),
								height: getToken('$12'),
								borderRadius: getToken('$1'),
							}}
						/>
					) : (
						<Text
							key={`${track.Id}-number`}
							color={isPlaying ? theme.primary.val : theme.color}
							width={getToken('$12')}
							textAlign='center'
						>
							{track.IndexNumber?.toString() ?? ''}
						</Text>
					)}
				</XStack>

				<YStack alignContent='center' justifyContent='flex-start' flex={6}>
					<Text
						key={`${track.Id}-name`}
						bold
						color={
							isPlaying
								? theme.primary.val
								: isOffline
									? isDownloaded
										? theme.color
										: theme.neutral.val
									: theme.color
						}
						lineBreakStrategyIOS='standard'
						numberOfLines={1}
					>
						{track.Name ?? 'Untitled Track'}
					</Text>

					{(showArtwork || (track.Artists && track.Artists.length > 1)) && (
						<Text
							key={`${track.Id}-artists`}
							lineBreakStrategyIOS='standard'
							numberOfLines={1}
						>
							{track.Artists?.join(', ') ?? ''}
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
					onPress={() => {
						if (showRemove) {
							if (onRemove) onRemove()
						} else {
							rootNavigation.navigate('Context', {
								item: track,
							})
						}
					}}
				/>
			</XStack>
		</Theme>
	)
}
