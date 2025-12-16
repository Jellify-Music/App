import { UserPlaylistsQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists, fetchPlaylistTracks } from './utils'
import { ApiLimits } from '../../../configs/query.config'
import {
	useApi,
	useJellifyLibrary,
	useJellifyUser,
	useAdapter,
	useJellifyServer,
} from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKeys } from '../../../enums/query-keys'
import {
	unifiedPlaylistsToBaseItems,
	unifiedTracksToBaseItems,
} from '../../../utils/unified-conversions'

export const useUserPlaylists = () => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(library),
		queryFn: async () => {
			// Use adapter for both backends
			if (adapter) {
				const playlists = await adapter.getPlaylists()
				return unifiedPlaylistsToBaseItems(playlists)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchUserPlaylists(api, user, library)
		},
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter,
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto) => {
	const api = useApi()
	const adapter = useAdapter()

	return useInfiniteQuery({
		// Changed from QueryKeys.ItemTracks to avoid cache conflicts with old useQuery data
		queryKey: [QueryKeys.ItemTracks, 'infinite', playlist.Id!],
		queryFn: async ({ pageParam }) => {
			// Use adapter for both backends
			if (adapter && playlist.Id) {
				const tracks = await adapter.getPlaylistTracks(playlist.Id)
				// Paginate client-side
				const startIndex = pageParam * ApiLimits.Library
				const paginatedTracks = tracks.slice(startIndex, startIndex + ApiLimits.Library)
				return unifiedTracksToBaseItems(paginatedTracks)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchPlaylistTracks(api, playlist.Id!, pageParam)
		},
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		enabled: !!adapter && Boolean(playlist.Id),
	})
}

// Note: Public playlists is a Jellyfin-specific concept
export const usePublicPlaylists = () => {
	const api = useApi()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	// Only run for Jellyfin backend - Navidrome doesn't have public playlists
	const isJellyfin = server?.backend !== 'navidrome'

	return useInfiniteQuery({
		queryKey: [QueryKeys.PublicPlaylists, library?.playlistLibraryId],
		queryFn: ({ pageParam }) => fetchPublicPlaylists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
		enabled: isJellyfin,
	})
}
