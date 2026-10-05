import { isNull, isUndefined } from 'lodash'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import { DownloadedTrack, PlayerQueue } from 'react-native-nitro-player'
import { AA_PLAYLIST_NAME_PREFIX } from '../../services/android-auto'

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
