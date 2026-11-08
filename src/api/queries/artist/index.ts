import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/querying/index.config'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import { useJellifyLibrary, useJellifyUser } from '../../../stores/auth'
import useLibraryStore from '../../../stores/library'
import { artistAlbumsQuery, artistQuery } from './queries'
import { QueryAges } from '../../../constants/durations'
import { MusicLibraryQueryKey } from '../libraries/keys'

export const useArtist = (artistId: BaseItemDto['Id']) =>
	useQuery({
		...artistQuery(artistId),
		enabled: !!artistId,
	})

export const useArtistAlbums = (artist: BaseItemDto) => {
	const [library] = useJellifyLibrary()

	return useQuery(artistAlbumsQuery(artist, library))
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [
			QueryKeys.ArtistFeaturedOn,
			MusicLibraryQueryKey(library?.musicLibraryId),
			artist.Id,
		],
		queryFn: ({ signal }) => fetchArtistFeaturedOn(library?.musicLibraryId, artist, signal),
		enabled: !isUndefined(artist.Id),
		gcTime: QueryAges.OneWeek,
	})
}

export const useAlbumArtists = () => {
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const sortDescending = useLibraryStore((state) => state.sortDescending.artists) ?? false
	const isFavorites = useLibraryStore((state) => state.filters.artists.isFavorites)

	const selectArtists = (data: InfiniteData<BaseItemDto[], unknown>) => {
		return flattenInfiniteQueryPages(data)
	}

	return useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteArtists,
			isFavorites,
			sortDescending,
			MusicLibraryQueryKey(library?.musicLibraryId),
		],
		queryFn: ({ pageParam, signal }: { pageParam: number; signal?: AbortSignal }) =>
			fetchArtists(
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
				signal,
			),
		select: selectArtists,
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})
}
