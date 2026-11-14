import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKey } from '@tanstack/react-query'
import { queryClient } from '../../client'
import { getUser } from '../../../stores/auth/utils'
import {
	PlaylistsQueryKey,
	PlaylistTracksQueryKey,
	PublicPlaylistsQueryKey,
	UserPlaylistsQueryKey,
} from './keys'
import { PlaylistTracksQuery, UserPlaylistsQuery } from './queries'
import { sortPlaylistsByName } from './utils/sort'

/**
 * Helpers for keeping the playlist caches in sync after a mutation,
 * so every screen reading from them updates together
 */

function updateItems(queryKey: QueryKey, updater: (items: BaseItemDto[]) => BaseItemDto[]) {
	queryClient.setQueryData<BaseItemDto[]>(queryKey, (prev) => (prev ? updater(prev) : prev))
}

const playlistListKeys = () => [UserPlaylistsQueryKey(getUser()), PublicPlaylistsQueryKey()]

/**
 * Always fetches the user's playlists from the server, updating the cache with the result
 *
 * @returns The user's playlists, sorted by name
 */
export async function refreshUserPlaylists() {
	return sortPlaylistsByName(await queryClient.query({ ...UserPlaylistsQuery(), staleTime: 0 }))
}

/**
 * Always fetches a playlist's tracks from the server, updating the cache with the result
 */
export function refreshPlaylistTracks(playlist: BaseItemDto) {
	return queryClient.query({ ...PlaylistTracksQuery(playlist), staleTime: 0 })
}

/**
 * Warms the cache with a playlist's tracks, unless they're already cached and fresh
 *
 * Errors are swallowed, since nothing is waiting on the result
 */
export async function prefetchPlaylistTracks(playlist: BaseItemDto) {
	return queryClient.query(PlaylistTracksQuery(playlist)).catch(() => {})
}

/**
 * Adds a playlist to the user's cached playlists
 *
 * @param playlist The playlist to add
 */
export function addUserPlaylist(playlist: BaseItemDto) {
	updateItems(UserPlaylistsQueryKey(getUser()), (playlists) => [playlist, ...playlists])
}

/**
 * Adds a playlist to the user's cached playlists
 *
 * @param playlist The playlist to add
 */
export function updateCachedPlaylist(playlistId: string, changes: Partial<BaseItemDto>) {
	playlistListKeys().forEach((queryKey) =>
		updateItems(queryKey, (playlists) =>
			playlists.map((playlist) =>
				playlist.Id === playlistId ? { ...playlist, ...changes } : playlist,
			),
		),
	)
}

/**
 * Removes a playlist from the cache, including its tracks
 *
 * @param playlistId The ID of the playlist to remove
 */
export function removeCachedPlaylist(playlistId: string) {
	playlistListKeys().forEach((queryKey) =>
		updateItems(queryKey, (playlists) =>
			playlists.filter((playlist) => playlist.Id !== playlistId),
		),
	)

	queryClient.removeQueries({ queryKey: PlaylistTracksQueryKey({ Id: playlistId }) })
}

/**
 * Appends tracks to a playlist's cached track list
 *
 * Also moves the playlist to the front of the user's playlists, matching
 * Jellyfin's `DateLastContentAdded` sort, so it tops the recently updated playlists
 *
 * @param playlist The playlist to append tracks to
 * @param tracks The tracks to append
 */
export function appendPlaylistTracks(playlist: BaseItemDto, tracks: BaseItemDto[]) {
	updateItems(PlaylistTracksQueryKey(playlist), (prev) => [...prev, ...tracks])
	updateItems(UserPlaylistsQueryKey(getUser()), (playlists) => {
		const updated = playlists.find(({ Id }) => Id === playlist.Id)

		return updated ? [updated, ...playlists.filter(({ Id }) => Id !== playlist.Id)] : playlists
	})
}

/**
 * Removes tracks from a playlist's cached track list
 *
 * Also moves the playlist to the front of the user's playlists, matching
 * Jellyfin's `DateLastContentAdded` sort, so it tops the recently updated playlists
 *
 * @param playlist The playlist to remove tracks from
 * @param tracks The tracks to remove
 */
export function removePlaylistTracks(playlist: BaseItemDto, tracks: BaseItemDto[]) {
	updateItems(PlaylistTracksQueryKey(playlist), (prev) =>
		prev.filter((track) => !tracks.some((t) => t.Id === track.Id)),
	)
	updateItems(UserPlaylistsQueryKey(getUser()), (playlists) => {
		const updated = playlists.find(({ Id }) => Id === playlist.Id)

		return updated ? [updated, ...playlists.filter(({ Id }) => Id !== playlist.Id)] : playlists
	})
}

/**
 * Replaces a playlist's cached tracks, i.e. after it's been reordered or had tracks removed
 *
 * @param playlist The playlist to set tracks for
 * @param tracks The new set of tracks for the playlist
 */
export function setPlaylistTracks(playlist: BaseItemDto, tracks: BaseItemDto[]) {
	updateItems(PlaylistTracksQueryKey(playlist), () => tracks)
}

/**
 * Invalidates a playlist's cached tracks, forcing them to be refetched
 *
 * @param playlist The playlist whose tracks should be invalidated
 */
export function invalidatePlaylistTracks(playlist: BaseItemDto) {
	return queryClient.invalidateQueries({ queryKey: PlaylistTracksQueryKey(playlist) })
}

/**
 * Invalidates all cached playlists, forcing them to be refetched
 */
export function invalidatePlaylists() {
	return queryClient.invalidateQueries({ queryKey: PlaylistsQueryKey })
}
