import { PlaylistTracksQueryKey, PublicPlaylistsQueryKey, UserPlaylistsQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists, fetchPlaylistTracks } from './utils'
import { ApiLimits } from '../../../configs/query.config'
import { getApi, getUser, useJellifyLibrary } from '../../../stores'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKeys } from '../../../enums/query-keys'

export const useUserPlaylists = () => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(library),
		queryFn: () => fetchUserPlaylists(api, user, library),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const api = getApi()

	return useInfiniteQuery({
		// Changed from QueryKeys.ItemTracks to avoid cache conflicts with old useQuery data
		queryKey: PlaylistTracksQueryKey(playlist),
		queryFn: ({ pageParam }) => fetchPlaylistTracks(api, playlist.Id!, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		enabled: Boolean(api && playlist.Id && !disabled),
	})
}

export const usePublicPlaylists = () => {
	const api = getApi()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: PublicPlaylistsQueryKey(library),
		queryFn: ({ pageParam }) => fetchPublicPlaylists(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})
}
