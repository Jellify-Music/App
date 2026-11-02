import { PlayerQueue, TrackItem } from 'react-native-nitro-player'
import uuid from 'react-native-uuid'
import { AA_PLAYLIST_NAME_PREFIX } from '../../../constants/android-auto'
import { PlayerQueueStore, PlayerQueueStoreSet } from '../types'

async function clearPlaylists() {
	await Promise.all(
		PlayerQueue.getAllPlaylists()
			// Android Auto's browse tree points at these; deleting them empties the car's folders
			.filter((playlist) => !playlist.name.startsWith(AA_PLAYLIST_NAME_PREFIX))
			.map((playlist) => PlayerQueue.deletePlaylist(playlist.id)),
	)
}

export const replaceQueue =
	(set: PlayerQueueStoreSet): PlayerQueueStore['replaceQueue'] =>
	async ({ queue, unShuffledQueue, queueRef, index, shuffled }) => {
		await clearPlaylists()

		const playlistId = await PlayerQueue.createPlaylist(uuid.v4(), undefined, undefined)

		await PlayerQueue.addTracksToPlaylist(playlistId, queue)

		// Set before loading so onChangeTrack finds the track instead of adopting the native playlist
		set({ queue, unShuffledQueue, queueRef, currentIndex: index, shuffled })

		await PlayerQueue.loadPlaylist(playlistId, index)
	}

/**
 * Applies the updated tracks to the queue store, matched by id. Mirrors the
 * player's `updateTracks` rules so the store doesn't drift from it: updates
 * without a URL are skipped, and once the current track has a URL, an update
 * that changes it is skipped (gapless)
 */
export function updateQueueStore(
	{ queue, unShuffledQueue, currentIndex, setQueue }: PlayerQueueStore,
	updatedTracks: TrackItem[],
): void {
	const currentTrack = currentIndex !== undefined ? queue[currentIndex] : undefined

	const updatedById = new Map(
		updatedTracks
			.filter((t) => !!t.url)
			.filter(
				(t) => !currentTrack?.url || t.id !== currentTrack.id || t.url === currentTrack.url,
			)
			.map((t) => [t.id, t]),
	)

	if (updatedById.size === 0) return

	setQueue(
		queue.map((t) => updatedById.get(t.id) ?? t),
		unShuffledQueue.map((t) => updatedById.get(t.id) ?? t),
	)
}
