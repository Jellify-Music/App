import { Platform } from 'react-native'
import { InfiniteData } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	AndroidAutoMediaLibraryHelper,
	PlayerQueue,
	TrackPlayer,
	type MediaItem,
	type MediaLibrary,
} from 'react-native-nitro-player'

import { queryClient } from '../constants/query-client'
import { getUser } from '../stores'
import useJellifyStore from '../stores'
import { useAutoStore } from '../stores/auto'
import { RecentlyPlayedTracksQueryKey } from '../api/queries/recents/keys'
import { FrequentlyPlayedTracksQueryKey } from '../api/queries/frequents/keys'
import { mapDtoToTrack } from '../utils/mapping/item-to-track'

/**
 * Playlists we materialize for Android Auto are tagged with this prefix so
 * `clearPlaylists` can leave them untouched when the user starts a new queue.
 */
export const AA_PLAYLIST_NAME_PREFIX = 'jellify-aa:'

const RECENTS_PLAYLIST_NAME = `${AA_PLAYLIST_NAME_PREFIX}recents`
const FREQUENTS_PLAYLIST_NAME = `${AA_PLAYLIST_NAME_PREFIX}frequents`

function getInfiniteList<T>(key: ReturnType<typeof RecentlyPlayedTracksQueryKey>): T[] {
	const data = queryClient.getQueryData<InfiniteData<T[]>>(key)
	return data?.pages.flatMap((page) => page) ?? []
}

/**
 * Delete every persisted Android Auto playlist. We re-create them on each
 * publish so the persisted `playlists.json` from a previous session can't
 * leak stale entries into the browse tree.
 */
async function deleteAllAaPlaylists(): Promise<void> {
	const playlists = PlayerQueue.getAllPlaylists().filter((p) =>
		p.name.startsWith(AA_PLAYLIST_NAME_PREFIX),
	)
	for (const playlist of playlists) {
		try {
			await PlayerQueue.deletePlaylist(playlist.id)
		} catch (error) {
			console.warn('Android Auto: failed to delete playlist', playlist.id, error)
		}
	}
}

async function createPlaylistFromTracks(
	name: string,
	items: BaseItemDto[],
): Promise<string | null> {
	if (items.length === 0) return null

	const tracks = await Promise.all(items.map((item) => mapDtoToTrack(item)))
	const playlistId = await PlayerQueue.createPlaylist(name)
	await PlayerQueue.addTracksToPlaylist(playlistId, tracks)
	return playlistId
}

let isPublishing = false

async function publishMediaLibrary(): Promise<void> {
	if (Platform.OS !== 'android') return
	if (isPublishing) return
	if (!AndroidAutoMediaLibraryHelper.isAvailable()) return

	const user = getUser()
	const library = useJellifyStore.getState().library
	if (!user || !library) return

	isPublishing = true
	try {
		const recentTracks = getInfiniteList<BaseItemDto>(
			RecentlyPlayedTracksQueryKey(user, library),
		)
		const frequentTracks = getInfiniteList<BaseItemDto>(
			FrequentlyPlayedTracksQueryKey(user, library),
		)

		// Wipe stale persisted AA playlists from prior sessions before recreating.
		await deleteAllAaPlaylists()

		// Cold-start with no Home cache yet — fall back to listing every
		// loaded PlayerQueue playlist (the native MediaBrowserService handles
		// this when no library is set).
		if (recentTracks.length === 0 && frequentTracks.length === 0) {
			AndroidAutoMediaLibraryHelper.clear()
			return
		}

		const recentsPlaylistId = await createPlaylistFromTracks(
			RECENTS_PLAYLIST_NAME,
			recentTracks,
		)
		const frequentsPlaylistId = await createPlaylistFromTracks(
			FREQUENTS_PLAYLIST_NAME,
			frequentTracks,
		)

		const rootItems: MediaItem[] = []
		if (recentsPlaylistId) {
			rootItems.push({
				id: 'aa-play-it-again',
				title: 'Play it again',
				subtitle: `${recentTracks.length} tracks`,
				isPlayable: false,
				mediaType: 'playlist',
				playlistId: recentsPlaylistId,
			})
		}
		if (frequentsPlaylistId) {
			rootItems.push({
				id: 'aa-on-repeat',
				title: 'On Repeat',
				subtitle: `${frequentTracks.length} tracks`,
				isPlayable: false,
				mediaType: 'playlist',
				playlistId: frequentsPlaylistId,
			})
		}

		const mediaLibrary: MediaLibrary = {
			layoutType: 'list',
			rootItems,
			appName: 'Jellify',
		}

		AndroidAutoMediaLibraryHelper.set(mediaLibrary)
	} catch (error) {
		console.warn('Android Auto: failed to publish media library', error)
	} finally {
		isPublishing = false
	}
}

let isRegistered = false

export default function registerAndroidAutoService(): () => void {
	if (Platform.OS !== 'android') return () => {}

	// Guard against re-registration on JS reload — the native side keeps every
	// listener we add, so without this each Fast Refresh would compound the
	// number of `publishMediaLibrary` calls per connection event.
	if (isRegistered) return () => {}
	isRegistered = true

	TrackPlayer.onAndroidAutoConnectionChange((connected: boolean) => {
		useAutoStore.getState().setIsConnected(connected)
		if (connected) {
			publishMediaLibrary()
		}
	})

	// Drop any persisted AA playlists left over from a previous session right
	// away so the MediaBrowserService fallback list can't show duplicates
	// before our first publish runs.
	deleteAllAaPlaylists()

	if (TrackPlayer.isAndroidAutoConnected()) {
		useAutoStore.getState().setIsConnected(true)
		publishMediaLibrary()
	}

	return () => {
		// nitro player has no unregister for the connection callback;
		// the listener lives for the app lifetime.
	}
}
