import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { PlayerQueue } from 'react-native-nitro-player'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { mapDtosToTracks } from '../../utils/mapping/item-to-track'
import { captureWarning, LoggingContext } from '../../utils/logging'
import { AA_PLAYLIST_NAME_PREFIX } from './tree'

/**
 * Delete every persisted Android Auto playlist except the one currently playing (a later
 * publish removes it once it's no longer current). They are re-created on each publish
 * so a stale `playlists.json` from a previous session can't leak old rows.
 */
export async function deleteAllAaPlaylists(): Promise<void> {
	const currentId = PlayerQueue.getCurrentPlaylistId()
	const playlists = PlayerQueue.getAllPlaylists().filter(
		(playlist) =>
			playlist.name.startsWith(AA_PLAYLIST_NAME_PREFIX) && playlist.id !== currentId,
	)

	for (const playlist of playlists) {
		try {
			await PlayerQueue.deletePlaylist(playlist.id)
		} catch (error) {
			captureWarning(
				LoggingContext.AndroidAuto,
				`Failed to delete playlist ${playlist.id}`,
				error,
			)
		}
	}
}

/**
 * Creates a native PlayerQueue playlist holding `items` so Android Auto can list and play them.
 * Downloaded tracks get their local file URL; streamed tracks get their URL lazily from the
 * player's `onTracksNeedUpdate`, exactly like the phone queue.
 *
 * @returns the native playlist id, or `null` when there is nothing to play
 */
export async function materializePlaylist(
	title: string,
	items: BaseItemDto[],
): Promise<string | null> {
	if (items.length === 0) return null

	const downloadedTracks = await ensureDownloadedTracks()
	const playlistId = await PlayerQueue.createPlaylist(`${AA_PLAYLIST_NAME_PREFIX}${title}`)
	await PlayerQueue.addTracksToPlaylist(playlistId, mapDtosToTracks(items, downloadedTracks))
	return playlistId
}
