import { usePlayerContext } from '../../../providers/Player'
import React from 'react'
import { getToken, getTokens, Theme, useTheme, XStack, YStack } from 'tamagui'
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
}: TrackProps): React.JSX.Element {
	const theme = useTheme()
	const { api, user } = useJellifyContext()
	const { nowPlaying, useStartPlayback } = usePlayerContext()
	const { playQueue, useLoadNewQueue } = useQueueContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()

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

	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<XStack
				alignContent='center'
				alignItems='center'
				height={showArtwork ? '$6' : '$5'}
				flex={1}
				onPress={() => {
					if (onPress) {
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
				}}
				onLongPress={
					onLongPress
						? () => onLongPress()
						: () => {
								navigation.navigate('Details', {
									item: track,
									isNested: isNested,
								})
							}
				}
				paddingVertical={'$2'}
			>
				<XStack
					alignContent='center'
					justifyContent='center'
					flex={1}
					marginHorizontal={showArtwork ? '$4' : '$1'}
				>
					{showArtwork ? (
						<FastImage
							source={{
								uri: getImageApi(api!).getItemImageUrlById(
									track.AlbumId! || track.Id!,
								),
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
				</XStack>
			</XStack>
		</Theme>
	)
}
