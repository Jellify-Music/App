import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk/lib/api'
import {
	BaseItemDto,
	BaseItemDtoQueryResult,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { setQueryUserDataForItems } from '../../user-data'
import { getApi } from '../../../../stores/auth/utils'
import { ArtistsSortBy } from '../../../../types/sorting/artist'
import { AxiosResponse } from 'axios'
import { queryClient } from '../../../../constants/query-client'
import { PlayItAgainQuery } from '../../recents'
import { captureError, LoggingContext } from '../../../../utils/logging'

export async function fetchArtists(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ArtistsSortBy,
	sortOrder: SortOrder,
	signal?: AbortSignal,
) {
	const api = getApi()

	if (!api) return Promise.reject('No API instance provided')
	if (!user) return Promise.reject('No user provided')
	if (!library) return Promise.reject('Library has not been set')

	try {
		let result: AxiosResponse<BaseItemDtoQueryResult>
		let items: BaseItemDto[]
		let recentTracks: BaseItemDto[]

		switch (sortBy) {
			case 'DatePlayed':
				recentTracks = await queryClient.infiniteQuery({
					...PlayItAgainQuery(library),
					initialPageParam: page,
					staleTime: 'static',
				})

				console.debug(recentTracks.map((track) => track.Id).join(','))

				items = recentTracks
					.map((track) => track.ArtistItems)
					.filter((artists) => !!artists)
					.map(([firstArtist]) => ({
						...firstArtist,
						Type: BaseItemKind.MusicArtist,
					}))

				break
			case 'SortName':
			default:
				result = await getArtistsApi(api).getAlbumArtists(
					{
						parentId: library.musicLibraryId,
						userId: user.id,
						sortBy: [sortBy],
						sortOrder: [sortOrder],
						startIndex: page * ApiLimits.Library,
						limit: ApiLimits.Library,
						isFavorite: isFavorite,
						fields: [ItemFields.SortName, ItemFields.Genres],
						enableImages: true,
						enableImageTypes: [ImageType.Backdrop, ImageType.Primary],
						imageTypeLimit: 1,
						enableUserData: true,
					},
					{
						signal,
					},
				)
				items = result.data.Items ?? []
				setQueryUserDataForItems(items)
		}

		return items
	} catch (error) {
		captureError(
			error,
			LoggingContext.Artists,
			`Failed to fetch artists with options: [sortBy: '${sortBy.toUpperCase()}', sortOptions: '${sortOrder.toUpperCase()}']`,
		)
		return Promise.reject(error)
	}
}

/**
 * Fetches all albums for an artist
 * @param libraryId The ID of the library to fetch albums from
 * @param artist The artist to fetch albums for
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistAlbums(
	libraryId: string | undefined,
	artist: BaseItemDto,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		getItemsApi(api)
			.getItems(
				{
					parentId: libraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					recursive: true,
					excludeItemIds: [artist.Id!],
					sortBy: [
						ItemSortBy.PremiereDate,
						ItemSortBy.ProductionYear,
						ItemSortBy.SortName,
					],
					sortOrder: [SortOrder.Descending],
					artistIds: [artist.Id!],
					fields: [ItemFields.ChildCount],
					enableUserData: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				const items = data.Items ?? []
				setQueryUserDataForItems(items)
				return resolve(items)
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches all albums that an artist is featured on
 * @param api The Jellyfin {@link Api} instance
 * @param artist The artist to fetch featured albums for
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistFeaturedOn(
	libraryId: string | undefined,
	artist: BaseItemDto,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		getItemsApi(api)
			.getItems(
				{
					parentId: libraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					recursive: true,
					excludeItemIds: [artist.Id!],
					sortBy: [
						ItemSortBy.PremiereDate,
						ItemSortBy.ProductionYear,
						ItemSortBy.SortName,
					],
					sortOrder: [SortOrder.Descending],
					contributingArtistIds: [artist.Id!],
					fields: [ItemFields.ParentId, ItemFields.ChildCount],
					enableUserData: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				const items = data.Items ?? []
				setQueryUserDataForItems(items)
				return resolve(items)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
