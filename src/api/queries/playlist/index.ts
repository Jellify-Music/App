import { UserPlaylistsQueryKey, PlaylistTracksQueryKey } from './keys'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists } from './utils'
import { ApiLimits } from '../../../configs/query.config'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { ONE_HOUR } from '../../../constants/query-client'

export const useUserPlaylists = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(library),
		queryFn: () => fetchUserPlaylists(api, user, library),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		// Only fetch when we have required dependencies
		enabled: Boolean(api && user && library?.playlistLibraryId),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
	})
}

/**
 * Fetches tracks for a specific playlist.
 * Uses the playlist ID as query key for granular cache invalidation.
 *
 * @param playlist - The playlist to fetch tracks for
 * @param options - Optional configuration
 * @param options.enabled - Whether the query should run (defaults to true if playlist.Id exists)
 */
export const usePlaylistTracks = (playlist: BaseItemDto, options?: { enabled?: boolean }) => {
	const api = useApi()
	const playlistId = playlist.Id

	return useQuery({
		// Guard against undefined playlistId
		queryKey: PlaylistTracksQueryKey(playlistId ?? ''),
		queryFn: async () => {
			const response = await getItemsApi(api!).getItems({
				parentId: playlistId!,
			})
			return response.data.Items ?? []
		},
		// Only fetch when we have the API and a valid playlist ID
		enabled: Boolean(api && playlistId) && (options?.enabled ?? true),
		// Playlist tracks change less frequently, use longer stale time
		staleTime: ONE_HOUR,
	})
}
