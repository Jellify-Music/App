import _, { isNull, isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { networkStatusTypes } from '../../../../components/Network/internetConnectionWatcher'
import { DownloadedTrack, PlayerQueue } from 'react-native-nitro-player'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../../services/androidauto'

export async function clearPlaylists() {
	await Promise.all(
		PlayerQueue.getAllPlaylists()
			.filter((playlist) => !playlist.name.startsWith(AA_PLAYLIST_NAME_PREFIX))
			.map((playlist) => {
				PlayerQueue.deletePlaylist(playlist.id)
			}),
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
