import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { queryClient } from '../../client'
import { artistAlbumsQuery, artistQuery } from './queries'

export function ensureArtistQueryData(artistId: BaseItemDto['Id']) {
	return queryClient.query({
		...artistQuery(artistId),
		staleTime: 'static',
	})
}

/**
 * Prefetches the artist query data to ensure that the artist query data is available in the cache.
 *
 * @param artistId The ID of the artist to prefetch query data for
 * @returns void
 */
export function prefetchArtistQueryData(artistId: BaseItemDto['Id']) {
	queryClient
		.query({
			...artistQuery(artistId),
			staleTime: 'static',
		})
		.catch(() => {})
}

export function prefetchArtistAlbumsQueryData(artist: BaseItemDto) {
	queryClient
		.query({
			...artistAlbumsQuery(artist),
			staleTime: 'static',
		})
		.catch(() => {})
}

export async function ensureArtistAlbumsQueryData(artist: BaseItemDto) {
	return await queryClient.query({
		...artistAlbumsQuery(artist),
		staleTime: 'static',
	})
}
