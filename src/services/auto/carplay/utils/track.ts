import { ensureDownloadedTracks } from '../../../../hooks/downloads/utils'
import { mapDtosToTracks } from '../../../../utils/mapping/item-to-track'
import { BaseItemDto, BaseItemKind, ItemSortBy } from '@jellyfin/sdk/lib/generated-client'
import { CarPlayListSection, DownloadManager, TrackItem } from 'react-native-nitro-player'
import carPlaylist from './playlist'
import i18n from '../../../../i18n'
import buildAudioApiUrl from '../../../../utils/mapping/item-to-audio-api-url'
import { TILE_LIMIT, TRACK_FIELDS } from '../constants'
import { getItems } from './items'
import { message } from './events'

export default async function toTracks(items: BaseItemDto[]) {
	return mapDtosToTracks(
		items.filter((item) => item.Type === BaseItemKind.Audio),
		await ensureDownloadedTracks(),
	)
}

export async function playableTracks(
	key: string,
	found: TrackItem[],
): Promise<CarPlayListSection[]> {
	if (found.length === 0) return [{ items: [message(i18n.t('car.empty'))] }]
	const { playlistId, tracks } = await carPlaylist(key, found)
	return [
		{
			items: tracks.map((track, index) => ({
				id: `${playlistId}:${index}`,
				title: track.title,
				subtitle: track.artist,
				image: track.artwork ?? 'music.note',
				playlistId,
				trackId: track.id,
			})),
		},
	]
}

// Read from the device, so it works without a connection
export async function downloadedTracks(): Promise<TrackItem[]> {
	const downloads = await DownloadManager.getAllDownloadedTracks()
	return downloads
		.sort((a, b) => b.downloadedAt - a.downloadedAt)
		.map((download) => ({
			...download.originalTrack,
			// Remote URL so a Cast receiver can load it; the player still plays the local file
			url: buildAudioApiUrl({ Id: download.trackId }, undefined),
			artwork: download.localArtworkPath
				? `file://${download.localArtworkPath}`
				: download.originalTrack.artwork,
		}))
}

export function favoriteTracks(musicLibraryId: string | undefined) {
	return getItems({
		parentId: musicLibraryId,
		includeItemTypes: [BaseItemKind.Audio],
		recursive: true,
		isFavorite: true,
		sortBy: [ItemSortBy.SortName],
		limit: TILE_LIMIT,
		fields: TRACK_FIELDS,
	})
}
