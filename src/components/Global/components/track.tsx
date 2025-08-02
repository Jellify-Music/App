import { usePlayerContext } from '../../../providers/Player'
import React from 'react'
import { getToken, Theme, useTheme, XStack, YStack } from 'tamagui'
import { Text } from '../helpers/text'
import { RunTimeTicks } from '../helpers/time-codes'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import { QueuingType } from '../../../enums/queuing-type'
import { Queue } from '../../../player/types/queue-item'
import FavoriteIcon from './favorite-icon'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { useNetworkContext } from '../../../providers/Network'
import { useQueueContext } from '../../../providers/Player/queue'
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
	testID?: string | undefined
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
	testID,
	isNested,
	invertedColors,
	showRemove,
	onRemove,
}: TrackProps): React.JSX.Element {
	const theme = useTheme()
	const { api } = useJellifyContext()
	const { nowPlaying } = usePlayerContext()
	const { playQueue, useLoadNewQueue } = useQueueContext()
	const { downloadedTracks, networkStatus } = useNetworkContext()

	const isPlaying = nowPlaying?.item.Id === track.Id

	const offlineAudio = downloadedTracks?.find((t) => t.item.Id === track.Id)
	const isDownloaded = offlineAudio?.item?.Id

	const isOffline = networkStatus === networkStatusTypes.DISCONNECTED

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
								navigation.navigate('Details', {
									item: track,
									isNested: isNested,
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
							navigation.navigate('Details', {
								item: track,
								isNested: isNested,
							})
						}
					}}
				/>
			</XStack>
		</Theme>
	)
}
