import { mapDtoToTrack } from '../../../utils/mappings'
import { networkStatusTypes } from '../../../components/Network/internetConnectionWatcher'
import { filterTracksOnNetworkStatus } from '../utils/queue'
import { AddToQueueMutation, QueueMutation } from '../interfaces'
import { QueuingType } from '../../../enums/queuing-type'
import { shuffleJellifyTracks } from '../utils/shuffle'
import TrackPlayer from 'react-native-track-player'
import JellifyTrack from '../../../types/JellifyTrack'
import { getCurrentTrack } from '.'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { usePlayerQueueStore } from '../../../stores/player/queue'
import { getAudioCache } from '../../../api/mutations/download/offlineModeUtils'
import { isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { MusicServerAdapter } from '../../../api/core/adapter'
import { Api } from '@jellyfin/sdk'
import { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Map a BaseItemDto to JellifyTrack using either adapter (Navidrome) or existing mapper (Jellyfin).
 */
function mapTrackToJellify(
	item: BaseItemDto,
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	deviceProfile: DeviceProfile | undefined,
	queuingType: QueuingType,
): JellifyTrack {
	// If adapter is provided, use it (for Navidrome)
	if (adapter) {
		// Convert BaseItemDto to UnifiedTrack-like shape for adapter
		const unifiedTrack = {
			id: item.Id ?? '',
			name: item.Name ?? 'Unknown',
			albumId: item.AlbumId ?? '',
			albumName: item.Album ?? '',
			artistId: item.ArtistItems?.[0]?.Id ?? '',
			artistName: item.Artists?.join(' • ') ?? '',
			duration: item.RunTimeTicks ? item.RunTimeTicks / 10_000_000 : 0,
			trackNumber: item.IndexNumber ?? undefined,
			discNumber: item.ParentIndexNumber ?? undefined,
			coverArtId: item.AlbumId ?? item.Id, // Use album ID for cover art, fallback to track ID
			normalizationGain: item.NormalizationGain ?? undefined,
		}
		return adapter.mapToJellifyTrack(unifiedTrack, queuingType)
	}

	// Fall back to existing Jellyfin mapper
	return mapDtoToTrack(api!, item, deviceProfile!, queuingType)
}

type LoadQueueResult = {
	finalStartIndex: number
	tracks: JellifyTrack[]
}

export async function loadQueue({
	index,
	tracklist,
	queue: queueRef,
	shuffled = false,
	api,
	adapter,
	deviceProfile,
	networkStatus = networkStatusTypes.ONLINE,
}: QueueMutation): Promise<LoadQueueResult> {
	usePlayerQueueStore.getState().setQueueRef(queueRef)
	usePlayerQueueStore.getState().setShuffled(shuffled)

	const startIndex = index ?? 0

	// Get the item at the start index
	const startingTrack = tracklist[startIndex]

	const downloadedTracks = getAudioCache()

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks using adapter when available
	let queue = availableAudioItems.map((item) =>
		mapTrackToJellify(item, adapter, api, deviceProfile, QueuingType.FromSelection),
	)

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(queue)

	// Handle if a shuffle was requested
	if (shuffled && queue.length > 1) {
		const { shuffled: shuffledTracks } = shuffleJellifyTracks(queue)
		queue = shuffledTracks
	}

	// The start index for the shuffled queue is always 0 (starting track is first)
	const finalStartIndex = availableAudioItems.findIndex((item) => item.Id === startingTrack.Id)

	await TrackPlayer.stop()

	/**
	 *  Keep the requested track as the currently playing track so there
	 * isn't any flickering in the miniplayer
	 */
	await TrackPlayer.setQueue([queue[finalStartIndex]])
	await TrackPlayer.add([...queue.slice(0, finalStartIndex), ...queue.slice(finalStartIndex + 1)])
	await TrackPlayer.move(0, finalStartIndex)

	return {
		finalStartIndex,
		tracks: queue,
	}
}

/**
 * Inserts a track at the next index in the queue
 *
 * Keeps a copy of the original queue in {@link unshuffledQueue}
 *
 * @param item The track to play next
 */
export const playNextInQueue = async ({
	api,
	adapter,
	deviceProfile,
	tracks,
}: AddToQueueMutation) => {
	const tracksToPlayNext = tracks.map((item) =>
		mapTrackToJellify(item, adapter, api, deviceProfile, QueuingType.PlayingNext),
	)

	const currentIndex = await TrackPlayer.getActiveTrackIndex()
	const currentQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]

	// If we're already at the end of the queue, add the track to the end
	if (currentIndex === currentQueue.length - 1) await TrackPlayer.add(tracksToPlayNext)
	// Else as long as we have an active index, we'll add the track(s) after that
	else if (!isUndefined(currentIndex)) await TrackPlayer.add(tracksToPlayNext, currentIndex + 1)

	// Get the active queue, put it in Zustand
	const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue([...updatedQueue])

	// Add to the state unshuffled queue, using the currently playing track as the index
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					0,
					usePlayerQueueStore.getState().unShuffledQueue.indexOf(getCurrentTrack()!) + 1,
				),
			...tracksToPlayNext,
			...usePlayerQueueStore
				.getState()
				.unShuffledQueue.slice(
					usePlayerQueueStore.getState().unShuffledQueue.indexOf(getCurrentTrack()!) + 1,
				),
		])
}

export const playLaterInQueue = async ({
	api,
	adapter,
	deviceProfile,
	tracks,
}: AddToQueueMutation) => {
	const newTracks = tracks.map((item) =>
		mapTrackToJellify(item, adapter, api, deviceProfile, QueuingType.DirectlyQueued),
	)

	// Then update RNTP
	await TrackPlayer.add(newTracks)

	const updatedQueue = (await TrackPlayer.getQueue()) as JellifyTrack[]
	usePlayerQueueStore.getState().setQueue(updatedQueue)

	// Update unshuffled queue with the same mapped tracks to avoid duplication
	usePlayerQueueStore
		.getState()
		.setUnshuffledQueue([...usePlayerQueueStore.getState().unShuffledQueue, ...newTracks])
}
