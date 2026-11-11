import { isNull, isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { DownloadedTrack, PlayerQueue, TrackItem } from 'react-native-nitro-player'
import { AA_PLAYLIST_NAME_PREFIX } from '../../services/auto/android-auto'
import uuid from 'react-native-uuid'
import { getTrackItemId } from '../../utils/mapping/track-extra-payload'

export async function clearPlaylists() {
	await Promise.all(
		PlayerQueue.getAllPlaylists()
			// Android Auto's browse tree points at these; deleting them empties the car's folders
			.filter((playlist) => !playlist.name.startsWith(AA_PLAYLIST_NAME_PREFIX))
			.map((playlist) => PlayerQueue.deletePlaylist(playlist.id)),
	)
}

export function filterTracksOnNetworkStatus(
	networkStatus: networkStatusTypes | undefined | null,
	queuedItems: BaseItemDto[],
	downloadedTracks: DownloadedTrack[],
) {
	if (
		isUndefined(networkStatus) ||
		isNull(networkStatus) ||
		networkStatus === networkStatusTypes.ONLINE
	)
		return queuedItems
	else
		return queuedItems.filter((item) =>
			downloadedTracks.map((download) => download.trackId).includes(item.Id!),
		)
}

/**
 * Gives each track its own queue entry ID so the same track can be queued more than once.
 *
 * The player removes and reorders tracks by ID, so IDs have to be unique within the queue.
 * The Jellyfin item ID stays on the track's payload, see {@link getTrackItemId}
 */
export function toQueueEntries(tracks: TrackItem[]): TrackItem[] {
	return tracks.map((track) => ({
		...track,
		id: uuid.v4(),
		// Carry the Jellyfin ID over for tracks that don't have it yet (i.e. existing downloads)
		extraPayload: { ...track.extraPayload, itemId: getTrackItemId(track) },
	}))
}
