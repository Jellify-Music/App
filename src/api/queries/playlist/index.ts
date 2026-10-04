import { PublicPlaylistsQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPublicPlaylists } from './utils'
import { getApi, getUser } from '../../../stores/auth/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { PlaylistTracksQuery, UserPlaylistsQuery } from './queries'

export const useUserPlaylists = () => {
	const api = getApi()
	const user = getUser()

	return useInfiniteQuery({
		...UserPlaylistsQuery(api, user),
		select: (data) => data.pages.flatMap((page) => page),
		enabled: Boolean(api && user),
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto, disabled?: boolean | undefined) => {
	const api = getApi()

	return useInfiniteQuery({
		...PlaylistTracksQuery(playlist, api),
		select: (data) => data.pages.flatMap((page) => page),
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
