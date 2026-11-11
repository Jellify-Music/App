import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { useNetworkStore } from '../../stores/network'
import { setPlaybackPosition } from '../../stores/player/playback'
import { usePlayerQueueStore, setNewQueue } from '../../stores/player/queue'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import { TrackPlayer, PlayerQueue } from 'react-native-nitro-player'
import { filterTracksOnNetworkStatus, clearPlaylists, toQueueEntries } from '../utils/queue'
import { shuffleJellifyTracks } from '../utils/shuffle'
import { QueueMutation } from '../interfaces'
import { LoadQueueResult } from './types'
import uuid from 'react-native-uuid'

export default async function loadQueue({
	index = 0,
	tracklist,
	queue,
	shuffled = false,
}: QueueMutation): Promise<LoadQueueResult> {
	await TrackPlayer.pause()

	const networkStatus = useNetworkStore.getState().networkStatus ?? networkStatusTypes.ONLINE

	// Get the item at the start index
	const startingTrack = tracklist[index]

	const downloadedTracks = await ensureDownloadedTracks()

	const availableAudioItems = filterTracksOnNetworkStatus(
		networkStatus as networkStatusTypes,
		tracklist,
		downloadedTracks ?? [],
	)

	// Convert to JellifyTracks first
	let playlist = toQueueEntries(mapDtosToTracks(availableAudioItems, downloadedTracks))

	// Look up the starting track by position, since the tracklist may contain the same track more than once
	const mappedStartingTrack = playlist[availableAudioItems.indexOf(startingTrack)]

	// Store the original unshuffled queue
	usePlayerQueueStore.getState().setUnshuffledQueue(playlist)

	// Handle if a shuffle was requested
	if (shuffled && playlist.length > 1) {
		if (mappedStartingTrack) {
			const remainingTracks = playlist.filter((track) => track.id !== mappedStartingTrack.id)
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(remainingTracks)
			playlist = [mappedStartingTrack, ...shuffledTracks]
		} else {
			const { shuffled: shuffledTracks } = shuffleJellifyTracks(playlist)
			playlist = shuffledTracks
		}
	}

	const rawStartIndex = mappedStartingTrack
		? playlist.findIndex((item) => item.id === mappedStartingTrack.id)
		: -1
	const finalStartIndex = rawStartIndex >= 0 ? rawStartIndex : 0

	await clearPlaylists()

	const playlistId = await PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)

	await PlayerQueue.addTracksToPlaylist(playlistId, playlist)

	setNewQueue(playlist, queue, finalStartIndex, shuffled)
	setPlaybackPosition(0)

	await PlayerQueue.loadPlaylist(playlistId, finalStartIndex)

	return {
		finalStartIndex,
		tracks: playlist,
	}
}
