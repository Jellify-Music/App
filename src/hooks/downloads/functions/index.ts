import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { mapDtoToTrack } from '../../../utils/mapping/item-to-track'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { DownloadManager, PlayerQueue } from 'react-native-nitro-player'
import uuid from 'react-native-uuid'

export async function downloadItems(items: BaseItemDto[]) {
	const playlistId = PlayerQueue.createPlaylist(uuid.v4())

	const tracks = items.map((item) => mapDtoToTrack(item))

	const resolvedTracks = await resolveTrackUrls(tracks, 'download')

	PlayerQueue.addTracksToPlaylist(playlistId, resolvedTracks)

	await Promise.all(resolvedTracks.map((track) => DownloadManager.downloadTrack(track)))
}
