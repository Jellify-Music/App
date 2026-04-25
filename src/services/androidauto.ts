import { Platform } from 'react-native'
import { InfiniteData } from '@tanstack/react-query'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import {
	AndroidAutoMediaLibraryHelper,
	PlayerQueue,
	TrackPlayer,
	type MediaItem,
	type MediaLibrary,
} from 'react-native-nitro-player'

import { queryClient } from '../constants/query-client'
import { getApi, getUser } from '../stores'
import useJellifyStore from '../stores'
import { useAutoStore } from '../stores/auto'
import {
	RecentlyPlayedArtistsQueryKey,
	RecentlyPlayedTracksQueryKey,
} from '../api/queries/recents/keys'
import {
	FrequentlyPlayedArtistsQueryKey,
	FrequentlyPlayedTracksQueryKey,
} from '../api/queries/frequents/keys'
import { mapDtoToTrack } from '../utils/mapping/item-to-track'

/**
 * Playlists we materialize for Android Auto are tagged with this prefix so
 * `clearPlaylists` can leave them untouched when the user starts a new queue.
 */
export const AA_PLAYLIST_NAME_PREFIX = 'jellify-aa:'

const RECENTS_PLAYLIST_NAME = `${AA_PLAYLIST_NAME_PREFIX}recents`
const FREQUENTS_PLAYLIST_NAME = `${AA_PLAYLIST_NAME_PREFIX}frequents`

const ROOT_RECENTS_ID = 'aa-recents'
const ROOT_FREQUENTS_ID = 'aa-frequents'
const RECENT_ARTISTS_ID = 'aa-recent-artists'
const FREQUENT_ARTISTS_ID = 'aa-frequent-artists'

function getInfiniteList<T>(key: ReturnType<typeof RecentlyPlayedTracksQueryKey>): T[] {
	const data = queryClient.getQueryData<InfiniteData<T[]>>(key)
	return data?.pages.flatMap((page) => page) ?? []
}

function getArtistImageUrl(artist: BaseItemDto): string | undefined {
	const api = getApi()
	if (!api || !artist.Id) return undefined
	if (!artist.ImageTags?.Primary) return undefined
	return getImageApi(api).getItemImageUrlById(artist.Id, ImageType.Primary)
}

function artistsAsBrowsableFolders(artists: BaseItemDto[], idPrefix: string): MediaItem[] {
	return artists.slice(0, 50).map((artist) => ({
		id: `${idPrefix}:${artist.Id}`,
		title: artist.Name ?? 'Unknown Artist',
		iconUrl: getArtistImageUrl(artist),
		isPlayable: false,
		mediaType: 'folder',
	}))
}

async function deleteOurPlaylists(): Promise<void> {
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
		const recentArtists = getInfiniteList<BaseItemDto>(
			RecentlyPlayedArtistsQueryKey(user, library),
		)
		const frequentTracks = getInfiniteList<BaseItemDto>(
			FrequentlyPlayedTracksQueryKey(user, library),
		)
		const frequentArtists = getInfiniteList<BaseItemDto>(
			FrequentlyPlayedArtistsQueryKey(user, library),
		)

		await deleteOurPlaylists()

		// If we have no Home data cached yet, clear the library so the
		// MediaBrowserService falls back to listing all loaded PlayerQueue
		// playlists (e.g. the currently-playing one). Avoids publishing an
		// empty browse tree on a cold launch.
		if (
			recentTracks.length === 0 &&
			frequentTracks.length === 0 &&
			recentArtists.length === 0 &&
			frequentArtists.length === 0
		) {
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

		const recentsChildren: MediaItem[] = [
			{
				id: RECENT_ARTISTS_ID,
				title: 'Recent Artists',
				subtitle: recentArtists.length > 0 ? `${recentArtists.length} artists` : undefined,
				isPlayable: false,
				mediaType: 'folder',
				layoutType: 'list',
				children: artistsAsBrowsableFolders(recentArtists, 'aa-ra'),
			},
		]
		if (recentsPlaylistId) {
			recentsChildren.push({
				id: 'aa-play-it-again',
				title: 'Play it again',
				subtitle: `${recentTracks.length} tracks`,
				isPlayable: false,
				mediaType: 'playlist',
				playlistId: recentsPlaylistId,
			})
		}

		const frequentsChildren: MediaItem[] = [
			{
				id: FREQUENT_ARTISTS_ID,
				title: 'Most Played',
				subtitle:
					frequentArtists.length > 0 ? `${frequentArtists.length} artists` : undefined,
				isPlayable: false,
				mediaType: 'folder',
				layoutType: 'list',
				children: artistsAsBrowsableFolders(frequentArtists, 'aa-fa'),
			},
		]
		if (frequentsPlaylistId) {
			frequentsChildren.push({
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
			rootItems: [
				{
					id: ROOT_RECENTS_ID,
					title: 'Recents',
					isPlayable: false,
					mediaType: 'folder',
					layoutType: 'list',
					children: recentsChildren,
				},
				{
					id: ROOT_FREQUENTS_ID,
					title: 'Frequents',
					isPlayable: false,
					mediaType: 'folder',
					layoutType: 'list',
					children: frequentsChildren,
				},
			],
			appName: 'Jellify',
		}

		AndroidAutoMediaLibraryHelper.set(mediaLibrary)
	} catch (error) {
		console.warn('Android Auto: failed to publish media library', error)
	} finally {
		isPublishing = false
	}
}

export default function registerAndroidAutoService(): () => void {
	if (Platform.OS !== 'android') return () => {}

	TrackPlayer.onAndroidAutoConnectionChange((connected: boolean) => {
		useAutoStore.getState().setIsConnected(connected)
		if (connected) {
			publishMediaLibrary()
		}
	})

	if (TrackPlayer.isAndroidAutoConnected()) {
		useAutoStore.getState().setIsConnected(true)
		publishMediaLibrary()
	}

	return () => {
		// nitro player has no unregister for the connection callback;
		// the listener lives for the app lifetime.
	}
}
