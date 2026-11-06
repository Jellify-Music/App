import { queryClient } from '../../client'
import { getApi, getLibrary, getUser } from '../../../stores/auth/utils'
import { JellifyUser } from '../../../types/JellifyUser'
import { JellifyLibrary } from '../../../types/JellifyLibrary'
import { fetchItem } from '../item'
import { RecentlyAddedQueryKey } from '../recents/keys'
import { fetchRecentlyAdded } from '../recents/utils'
import { AlbumQueryKey } from './keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { Api } from '@jellyfin/sdk'
import { QueryAges } from '../../../constants/durations'
import { BaseItemDtoInfiniteQueryOptions } from '../../types/infinite-query'

export const AlbumQuery = (album: BaseItemDto) => {
	const api = getApi()

	return {
		queryKey: AlbumQueryKey(album),
		queryFn: ({ signal }: { signal: AbortSignal }) => fetchItem(album.Id, signal),
		enabled: Boolean(album.Id) && Boolean(api),
		staleTime: QueryAges.OneDay,
	}
}

export const RecentlyAddedQuery: (
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => BaseItemDtoInfiniteQueryOptions = (api, user, library) => {
	return {
		queryKey: RecentlyAddedQueryKey(user, library),
		queryFn: ({ pageParam, signal }) => fetchRecentlyAdded(api, library, pageParam, signal),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	}
}

export const ensureRecentlyAddedQueryData = async () => {
	const api = getApi()
	const user = getUser()
	const library = getLibrary()

	return queryClient.infiniteQuery({
		...RecentlyAddedQuery(api, user, library),
		staleTime: 'static',
	})
}
