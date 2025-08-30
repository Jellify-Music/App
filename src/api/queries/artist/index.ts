import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isString, isUndefined } from 'lodash'
import { fetchArtistAlbums, fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { useJellifyContext } from '../../../providers'
import { ApiLimits } from '../query.config'
import { useCallback, useRef } from 'react'

export const useArtistAlbums = (artist: BaseItemDto) => {
	const { api, library } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.ArtistAlbums, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistAlbums(api, library?.musicLibraryId, artist),
		enabled: !isUndefined(artist.Id),
	})
}

export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const { api, library } = useJellifyContext()

	return useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistFeaturedOn(api, library?.musicLibraryId, artist),
		enabled: !isUndefined(artist.Id),
	})
}

interface AlbumArtistQueryParams {
	isFavorites: boolean | undefined
	sortDescending: boolean
}

export const useAlbumArtists: (
	params: AlbumArtistQueryParams,
) => [
	React.RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>,
] = ({ isFavorites, sortDescending }: AlbumArtistQueryParams) => {
	const { api, user, library } = useJellifyContext()

	const artistPageParams = useRef<Set<string>>(new Set<string>())

	// Memoize the expensive artists select function
	const selectArtists = useCallback((data: InfiniteData<BaseItemDto[], unknown>) => {
		/**
		 * A flattened array of all artists derived from the infinite query
		 */
		const flattenedArtistPages = data.pages.flatMap((page) => page)

		/**
		 * A set of letters we've seen so we can add them to the alphabetical selector
		 */
		const seenLetters = new Set<string>()

		/**
		 * The final array that will be provided to and rendered by the {@link Artists} component
		 */
		const flashArtistList: (string | number | BaseItemDto)[] = []

		flattenedArtistPages.forEach((artist: BaseItemDto) => {
			const rawLetter = isString(artist.SortName)
				? artist.SortName.trim().charAt(0).toUpperCase()
				: '#'

			/**
			 * An alpha character or a hash if the artist's name doesn't start with a letter
			 */
			const letter = rawLetter.match(/[A-Z]/) ? rawLetter : '#'

			if (!seenLetters.has(letter)) {
				seenLetters.add(letter)
				flashArtistList.push(letter)
			}

			flashArtistList.push(artist)
		})

		artistPageParams.current = seenLetters

		return flashArtistList
	}, [])

	const artistsInfiniteQuery = useInfiniteQuery({
		queryKey: [QueryKeys.InfiniteArtists, isFavorites, sortDescending, library?.musicLibraryId],
		queryFn: ({ pageParam }: { pageParam: number }) =>
			fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			),
		select: selectArtists,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
	})

	return [artistPageParams, artistsInfiniteQuery]
}
