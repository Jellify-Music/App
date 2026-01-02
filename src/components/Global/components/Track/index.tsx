import React, { useState } from 'react'
import { getToken, useTheme } from 'tamagui'
import { RunTimeTicks } from '../../helpers/time-codes'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueuingType } from '../../../../enums/queuing-type'
import { Queue } from '../../../../player/types/queue-item'
import { networkStatusTypes } from '../../../Network/internetConnectionWatcher'
import { useNetworkStatus } from '../../../../stores/network'
import navigationRef from '../../../../../navigation'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../../../screens/types'
import { useAddToQueue, useLoadNewQueue } from '../../../../providers/Player/hooks/callbacks'
import { useDownloadedTrack } from '../../../../api/queries/download'
import SwipeableRow from '../SwipeableRow'
import { useSwipeSettingsStore } from '../../../../stores/settings/swipe'
import { buildSwipeConfig } from '../../helpers/swipe-actions'
import { useIsFavorite } from '../../../../api/queries/user-data'
import { useCurrentTrackId, usePlayQueue } from '../../../../stores/player/queue'
import { useAddFavorite, useRemoveFavorite } from '../../../../api/mutations/favorite'
import { StackActions } from '@react-navigation/native'
import { useHideRunTimesSetting } from '../../../../stores/settings/app'
import useStreamedMediaInfo from '../../../../api/queries/media'
import TrackRowContent from './content'

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

	const [hideRunTimes] = useHideRunTimesSetting()

	const currentTrackId = useCurrentTrackId()
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
	const isPlaying = currentTrackId === track.Id

	const isOffline = networkStatus === networkStatusTypes.DISCONNECTED

	// Memoize tracklist for queue loading
	const memoizedTracklist = tracklist ?? playQueue?.map((track) => track.item) ?? []

	// Memoize handlers to prevent recreation
	const handlePress = async () => {
		if (onPress) {
			await onPress()
		} else {
			loadNewQueue({
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
				? undefined
				: theme.neutral.val
			: undefined

	// Memoize artists text
	const artistsText = track.Artists?.join(' • ') ?? ''

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

	if (isNested) {
		return (
			<TrackRowContent
				track={track}
				invertedColors={invertedColors}
				artworkAreaWidth={artworkAreaWidth}
				setArtworkAreaWidth={setArtworkAreaWidth}
				showArtwork={showArtwork}
				textColor={textColor}
				indexNumber={indexNumber}
				trackName={trackName}
				shouldShowArtists={shouldShowArtists ?? false}
				artistsText={artistsText}
				runtimeComponent={runtimeComponent}
				editing={editing}
				handleIconPress={handleIconPress}
				testID={testID}
			/>
		)
	}

	return (
		<SwipeableRow
			disabled={isNested}
			{...swipeConfig}
			onLongPress={handleLongPress}
			onPress={handlePress}
		>
			<TrackRowContent
				track={track}
				invertedColors={invertedColors}
				artworkAreaWidth={artworkAreaWidth}
				setArtworkAreaWidth={setArtworkAreaWidth}
				showArtwork={showArtwork}
				textColor={textColor}
				indexNumber={indexNumber}
				trackName={trackName}
				shouldShowArtists={shouldShowArtists ?? false}
				artistsText={artistsText}
				runtimeComponent={runtimeComponent}
				editing={editing}
				handleIconPress={handleIconPress}
				testID={testID}
			/>
		</SwipeableRow>
	)
}
