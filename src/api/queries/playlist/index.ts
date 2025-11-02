import { useJellifyContext } from '../../../providers'
import { UserPlaylistsQueryKey } from './keys'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists } from './utils'
import { ApiLimits } from '../query.config'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { QueryKeys } from '../../../enums/query-keys'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'

export const useUserPlaylists = () => {
	const { api, user, library } = useJellifyContext()

	return useInfiniteQuery({
		queryKey: UserPlaylistsQueryKey(library),
		queryFn: () => fetchUserPlaylists(api, user, library),
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
	})
}

export const usePlaylistTracks = (playlist: BaseItemDto) => {
	const { api } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.ItemTracks, playlist.Id!],
		queryFn: () => {
			return getItemsApi(api!)
				.getItems({
					parentId: playlist.Id!,
				})
				.then((response) => {
					return response.data.Items ? response.data.Items! : []
				})
		},
	})
}
