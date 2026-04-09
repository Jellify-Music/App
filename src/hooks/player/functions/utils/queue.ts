import _, { isNull, isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { networkStatusTypes } from '../../../../components/Network/internetConnectionWatcher'
import { DownloadedTrack, PlayerQueue } from 'react-native-nitro-player'

export async function clearPlaylists() {
	const playlists = await PlayerQueue.getAllPlaylists()
	await Promise.allSettled(playlists.map((playlist) => PlayerQueue.deletePlaylist(playlist.id)))
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
