import { useJellifyContext } from '../../../providers'
import { UserPlaylistsQueryKey } from './keys'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchUserPlaylists, fetchPublicPlaylists } from './utils'
import { ApiLimits } from '../query.config'

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
