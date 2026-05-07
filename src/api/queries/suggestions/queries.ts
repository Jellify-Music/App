import { JellifyUser } from '@/src/types/JellifyUser'
import { SuggestionQueryKeys } from './keys'
import { fetchAlbumSuggestions, fetchArtistSuggestions } from './utils/suggestions'
import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { UndefinedInitialDataInfiniteOptions } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { queryClient } from '../../../constants/query-client'

export const DiscoverArtistsQuery = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => {
	return {
		queryKey: [
			SuggestionQueryKeys.InfiniteArtistSuggestions,
			user?.id,
			library?.musicLibraryId,
		],
		queryFn: ({ pageParam }) =>
			fetchArtistSuggestions(user, library?.musicLibraryId, pageParam),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		maxPages: 2,
	} as UndefinedInitialDataInfiniteOptions<
		BaseItemDto[],
		Error,
		BaseItemDto[],
		(string | undefined)[],
		number
	>
}

export async function ensureDiscoverArtistsQueryData(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) {
	return await queryClient.ensureInfiniteQueryData(DiscoverArtistsQuery(user, library))
}

export const DiscoverAlbumsQuery = (
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) => {
	return {
		queryKey: [SuggestionQueryKeys.InfiniteAlbumSuggestions, user?.id, library?.musicLibraryId],
		queryFn: ({ pageParam }) => fetchAlbumSuggestions(user, library?.musicLibraryId, pageParam),
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
			lastPage.length > 0 ? lastPageParam + 1 : undefined,
		select: (data) => data.pages.flatMap((page) => page),
		initialPageParam: 0,
		maxPages: 2,
	} as UndefinedInitialDataInfiniteOptions<
		BaseItemDto[],
		Error,
		BaseItemDto[],
		(string | undefined)[],
		number
	>
}

export async function ensureDiscoverAlbumsQueryData(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
) {
	return await queryClient.ensureInfiniteQueryData(DiscoverAlbumsQuery(user, library))
}
