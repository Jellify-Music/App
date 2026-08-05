import { isNull, isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { DownloadedTrack, PlayerQueue } from 'react-native-nitro-player'
import NetworkStatus from '../../../../enums/network'

export async function clearPlaylists() {
	await Promise.all(
		PlayerQueue.getAllPlaylists().map((playlist) => {
			return PlayerQueue.deletePlaylist(playlist.id)
		}),
	)
}

export function filterTracksOnNetworkStatus(
	networkStatus: NetworkStatus | undefined | null,
	queuedItems: BaseItemDto[],
	downloadedTracks: DownloadedTrack[],
) {
	if (
		isUndefined(networkStatus) ||
		isNull(networkStatus) ||
		networkStatus === NetworkStatus.ONLINE
	)
		return queuedItems
	else
		return queuedItems.filter((item) =>
			downloadedTracks.map((download) => download.trackId).includes(item.Id!),
		)
}
