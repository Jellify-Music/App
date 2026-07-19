import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { fetchGenres } from './utils'
import { GenresQueryKey } from './keys'
import { getApi, getUser } from '../../../stores/auth/utils'
import { useJellifyLibrary } from '../../../stores/auth'
import { ApiLimits } from '../../../configs/query.config'

export const useGenres = (): UseInfiniteQueryResult<BaseItemDto[], Error> => {
	const api = getApi()
	const user = getUser()
	const [library] = useJellifyLibrary()

	return useInfiniteQuery({
		queryKey: GenresQueryKey(library?.musicLibraryId, user?.id),
		queryFn: ({ pageParam, signal }) => fetchGenres(api, user, library, pageParam, signal),
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		select: (data) => data.pages.flatMap((page) => page),
	})
}
