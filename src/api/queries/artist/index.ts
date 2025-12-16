import { QueryKeys } from '../../../enums/query-keys'
import { BaseItemDto, ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import {
	InfiniteData,
	useInfiniteQuery,
	UseInfiniteQueryResult,
	useQuery,
} from '@tanstack/react-query'
import { isUndefined } from 'lodash'
import { fetchArtistAlbums, fetchArtistFeaturedOn, fetchArtists } from './utils/artist'
import { ApiLimits, MaxPages } from '../../../configs/query.config'
import { RefObject, useCallback, useRef } from 'react'
import flattenInfiniteQueryPages from '../../../utils/query-selectors'
import {
	useApi,
	useJellifyLibrary,
	useJellifyUser,
	useJellifyServer,
	useAdapter,
} from '../../../stores'
import useLibraryStore from '../../../stores/library'
import { UnifiedArtist } from '../../core/types'

// Helper to convert UnifiedArtist to BaseItemDto-like format for compatibility
function unifiedArtistToBaseItem(artist: UnifiedArtist): BaseItemDto {
	return {
		Id: artist.id,
		Name: artist.name,
		SortName: artist.name, // Use name as sort name
		Type: 'MusicArtist',
		ImageTags: artist.coverArtId ? { Primary: artist.coverArtId } : undefined,
	}
}

export const useArtistAlbums = (artist: BaseItemDto) => {
	const api = useApi()
	const adapter = useAdapter()
	const [library] = useJellifyLibrary()

	return useQuery({
		queryKey: [QueryKeys.ArtistAlbums, library?.musicLibraryId, artist.Id],
		queryFn: async () => {
			// Use adapter if available
			if (adapter && artist.Id) {
				const albums = await adapter.getArtistAlbums(artist.Id)
				// Convert to BaseItemDto format for compatibility
				return albums.map(
					(album) =>
						({
							Id: album.id,
							Name: album.name,
							Type: 'MusicAlbum',
							AlbumArtist: album.artistName,
							ProductionYear: album.year,
							ImageTags: album.coverArtId ? { Primary: album.coverArtId } : undefined,
						}) as BaseItemDto,
				)
			}
			// Fallback to Jellyfin-specific fetch
			return fetchArtistAlbums(api, library?.musicLibraryId, artist)
		},
		enabled: !!adapter && !isUndefined(artist.Id),
	})
}

// Note: Featured On is a Jellyfin-specific concept (albums where artist appears as guest)
// Navidrome doesn't have this distinction, so we keep backend check here
export const useArtistFeaturedOn = (artist: BaseItemDto) => {
	const api = useApi()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()

	// Only run for Jellyfin backend - Navidrome doesn't have this concept
	const isJellyfin = server?.backend !== 'navidrome'

	return useQuery({
		queryKey: [QueryKeys.ArtistFeaturedOn, library?.musicLibraryId, artist.Id],
		queryFn: () => fetchArtistFeaturedOn(api, library?.musicLibraryId, artist),
		enabled: isJellyfin && !isUndefined(artist.Id),
	})
}

export const useAlbumArtists: () => [
	RefObject<Set<string>>,
	UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>,
] = () => {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [server] = useJellifyServer()
	const adapter = useAdapter()

	const { isFavorites, sortDescending } = useLibraryStore()

	const artistPageParams = useRef<Set<string>>(new Set<string>())
	const isNavidrome = server?.backend === 'navidrome'

	// Memoize the expensive artists select function
	const selectArtists = useCallback(
		(data: InfiniteData<BaseItemDto[], unknown>) =>
			flattenInfiniteQueryPages(data, artistPageParams),
		[],
	)

	const artistsInfiniteQuery = useInfiniteQuery({
		queryKey: [
			QueryKeys.InfiniteArtists,
			isFavorites,
			sortDescending,
			library?.musicLibraryId,
			isNavidrome,
		],
		queryFn: async ({ pageParam }: { pageParam: number }) => {
			// For Navidrome, use the adapter
			if (isNavidrome && adapter) {
				const artists = await adapter.getArtists()
				// Apply sorting and filtering client-side since Navidrome returns all at once
				let filtered = artists

				// Sort by name, handling sortDescending flag
				filtered = filtered.sort((a, b) => {
					const nameA = a.name.toLowerCase()
					const nameB = b.name.toLowerCase()
					return sortDescending ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB)
				})

				// Paginate client-side
				const startIndex = pageParam * ApiLimits.Library
				const endIndex = startIndex + ApiLimits.Library
				const paginatedArtists = filtered.slice(startIndex, endIndex)

				// Convert to BaseItemDto format for compatibility
				return paginatedArtists.map(unifiedArtistToBaseItem)
			}

			// For Jellyfin, use the existing fetch function
			return fetchArtists(
				api,
				user,
				library,
				pageParam,
				isFavorites,
				[ItemSortBy.SortName],
				[sortDescending ? SortOrder.Descending : SortOrder.Ascending],
			)
		},
		select: selectArtists,
		maxPages: MaxPages.Library,
		initialPageParam: 0,
		getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
			return lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined
		},
		getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
			return firstPageParam === 0 ? null : firstPageParam - 1
		},
		enabled: isNavidrome ? !!adapter : true,
	})

	return [artistPageParams, artistsInfiniteQuery]
}
