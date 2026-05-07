import { UndefinedInitialDataInfiniteOptions } from '@tanstack/react-query'
import { ONE_DAY, queryClient } from '../../../constants/query-client'
import { getApi, getLibrary, getUser } from '../../../stores'
import { fetchItem } from '../item'
import { RecentlyAddedQueryKey } from '../recents/keys'
import { fetchRecentlyAdded } from '../recents/utils'
import { AlbumQueryKey } from './keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { Api } from '@jellyfin/sdk'

export const AlbumQuery = (album: BaseItemDto) => {
	const api = getApi()

	return {
		queryKey: AlbumQueryKey(album),
		queryFn: () => fetchItem(api, album.Id!),
		enabled: !!album.Id && !!api,
		staleTime: ONE_DAY,
	}
}

export const RecentlyAddedQuery = (
	api: Api | undefined = getApi(),
	user = getUser(),
	library = getLibrary(),
) => {
	return {
		queryKey: RecentlyAddedQueryKey(user, library),
		queryFn: ({ pageParam }) => fetchRecentlyAdded(api, library, pageParam),
		select: (data) => data.pages.flatMap((page) => page),
		getNextPageParam: (lastPage, allPages, lastPageParam) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		initialPageParam: 0,
	} as UndefinedInitialDataInfiniteOptions<
		BaseItemDto[],
		Error,
		BaseItemDto[],
		(string | undefined)[],
		number
	>
}

export const ensureRecentlyAddedQueryData = async () => {
	return queryClient.ensureInfiniteQueryData(RecentlyAddedQuery())
}
