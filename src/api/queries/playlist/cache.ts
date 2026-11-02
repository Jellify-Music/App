import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKey } from '@tanstack/react-query'
import { queryClient } from '../../../constants/query-client'
import { getUser } from '../../../stores/auth/utils'
import {
	PlaylistsQueryKey,
	PlaylistTracksQueryKey,
	PublicPlaylistsQueryKey,
	UserPlaylistsQueryKey,
} from './keys'
import { PlaylistTracksQuery, UserPlaylistsQuery } from './queries'

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
 */
export function refreshUserPlaylists() {
	return queryClient.query({ ...UserPlaylistsQuery(), staleTime: 0 })
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

export function addUserPlaylist(playlist: BaseItemDto) {
	updateItems(UserPlaylistsQueryKey(getUser()), (playlists) => [playlist, ...playlists])
}

export function updateCachedPlaylist(playlistId: string, changes: Partial<BaseItemDto>) {
	playlistListKeys().forEach((queryKey) =>
		updateItems(queryKey, (playlists) =>
			playlists.map((playlist) =>
				playlist.Id === playlistId ? { ...playlist, ...changes } : playlist,
			),
		),
	)
}

export function removeCachedPlaylist(playlistId: string) {
	playlistListKeys().forEach((queryKey) =>
		updateItems(queryKey, (playlists) =>
			playlists.filter((playlist) => playlist.Id !== playlistId),
		),
	)

	queryClient.removeQueries({ queryKey: PlaylistTracksQueryKey({ Id: playlistId }) })
}

export function appendPlaylistTracks(playlist: BaseItemDto, tracks: BaseItemDto[]) {
	updateItems(PlaylistTracksQueryKey(playlist), (prev) => [...prev, ...tracks])
}

/**
 * Replaces a playlist's cached tracks, i.e. after it's been reordered or had tracks removed
 */
export function setPlaylistTracks(playlist: BaseItemDto, tracks: BaseItemDto[]) {
	updateItems(PlaylistTracksQueryKey(playlist), () => tracks)
}

export function invalidatePlaylistTracks(playlist: BaseItemDto) {
	return queryClient.invalidateQueries({ queryKey: PlaylistTracksQueryKey(playlist) })
}

export function invalidatePlaylists() {
	return queryClient.invalidateQueries({ queryKey: PlaylistsQueryKey })
}
