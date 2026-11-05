import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { PlaylistTracksQuery, PublicPlaylistsQuery, UserPlaylistsQuery } from './queries'
import { sortPlaylistsByLastUpdated } from './utils/sort'

export const useUserPlaylists = () => useQuery(UserPlaylistsQuery())

/**
 * The user's playlists, most recently updated first
 *
 * Reads from the same cache as {@link useUserPlaylists}, so it's kept in sync
 * by the helpers in `cache.ts` without a second request to the server
 */
export const useRecentlyUpdatedPlaylists = () =>
	useQuery({ ...UserPlaylistsQuery(), select: sortPlaylistsByLastUpdated })

export const usePublicPlaylists = () => useQuery(PublicPlaylistsQuery())

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const query = PlaylistTracksQuery(playlist)

	return useQuery({ ...query, enabled: query.enabled && !disabled })
}
