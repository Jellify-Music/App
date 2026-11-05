import { useQuery } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { PlaylistTracksQuery, PublicPlaylistsQuery, UserPlaylistsQuery } from './queries'
import { sortPlaylistsByName } from './utils/sort'

/**
 * Fetches the user's playlists from the cache or server, sorted by name
 *
 * @returns The user's playlists, sorted by name
 */
export const useUserPlaylists = () =>
	useQuery({ ...UserPlaylistsQuery(), select: sortPlaylistsByName })

/**
 * The user's playlists, most recently updated first
 *
 * Reads from the same cache as {@link useUserPlaylists}, which Jellyfin returns
 * in this order, so it's kept in sync by the helpers in `cache.ts` without a
 * second request to the server
 *
 * @returns The user's playlists, most recently updated first
 */
export const useRecentlyUpdatedPlaylists = () => useQuery(UserPlaylistsQuery())

/**
 * The "public" playlists, which are accessible to all users and
 * are in the form of a .m3u or .m3u8 file in the music library.
 *
 * @returns The public playlists, sorted by name
 */
export const usePublicPlaylists = () => useQuery(PublicPlaylistsQuery())

/**
 * Fetches a playlist's tracks from the cache or server
 *
 * @param playlist The playlist whose tracks should be fetched
 * @param disabled Whether the query should be disabled
 * @returns The playlist's tracks
 */
export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const query = PlaylistTracksQuery(playlist)

	return useQuery({ ...query, enabled: query.enabled && !disabled })
}
