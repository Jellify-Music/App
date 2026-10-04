import { PlaylistTracksQueryKey, PublicPlaylistsQueryKey, UserPlaylistsQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists, fetchPlaylistTracks } from './utils'
import { ApiLimits } from '../../../configs/querying/index.config'
import { getApi, getUser } from '../../../stores/auth/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export const useUserPlaylists = () => {
	const api = getApi()
	const user = getUser()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(user),
		queryFn: ({ signal }) => fetchUserPlaylists(api, user, [], signal),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			if (!lastPage) return undefined
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		enabled: Boolean(api && user),
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const api = getApi()

	return useInfiniteQuery({
		queryKey: PlaylistTracksQueryKey(playlist),
		queryFn: ({ pageParam, signal }) =>
			fetchPlaylistTracks(api, playlist.Id!, pageParam, signal),
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

	return useInfiniteQuery({
		queryKey: PublicPlaylistsQueryKey(),
		queryFn: ({ pageParam, signal }) => fetchPublicPlaylists(api, pageParam, signal),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	})
}
