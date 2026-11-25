import { PlayerQueue, TrackItem, TrackPlayer } from 'react-native-nitro-player'
import { AA_PLAYLIST_NAME_PREFIX } from '../../android-auto'

// Tracks only play from a PlayerQueue playlist; build one per list, replacing the previous copy afterwards
export default async function carPlaylist(key: string, tracks: TrackItem[]) {
	const name = `${AA_PLAYLIST_NAME_PREFIX}${key}`
	const { currentPlaylistId } = await TrackPlayer.getState()
	const previous = PlayerQueue.getAllPlaylists().filter(
		(p) => p.name === name && p.id !== currentPlaylistId,
	)
	const playlistId = await PlayerQueue.createPlaylist(name)
	await PlayerQueue.addTracksToPlaylist(playlistId, tracks)
	await Promise.all(previous.map((p) => PlayerQueue.deletePlaylist(p.id)))
	return { playlistId, tracks }
}
