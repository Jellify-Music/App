import { JellifyLibrary } from '@/src/types/JellifyLibrary'
import { Api } from '@jellyfin/sdk/lib/api'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../types/JellifyUser'
import QueryConfig from './query.config'

export function fetchArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
): Promise<BaseItemDto[]> {
	console.debug('Fetching artists', page)

	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		getArtistsApi(api)
			.getAlbumArtists({
				parentId: library.musicLibraryId,
				userId: user.id,
				enableUserData: true,
				sortBy: sortBy,
				sortOrder: sortOrder,
				startIndex: page * QueryConfig.limits.library,
				limit: QueryConfig.limits.library,
				isFavorite: isFavorite,
				fields: [ItemFields.SortName, ItemFields.ChildCount],
			})
			.then((response) => {
				console.debug('Artists Response received')
				return response.data.Items ? resolve(response.data.Items) : resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches all albums for an artist
 * @param api The Jellyfin {@link Api} instance
 * @param artist The artist to fetch albums for
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistAlbums(
	api: Api | undefined,
	libraryId: string | undefined,
	artist: BaseItemDto,
): Promise<BaseItemDto[]> {
	console.debug('Fetching artist albums')

	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		getItemsApi(api!)
			.getItems({
				parentId: libraryId,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
				excludeItemIds: [artist.Id!],
				sortBy: [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName],
				sortOrder: [SortOrder.Descending],
				albumArtistIds: [artist.Id!],
			})
			.then((response) => {
				return response.data.Items ? resolve(response.data.Items) : resolve([])
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
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistFeaturedOn(
	api: Api | undefined,
	libraryId: string | undefined,
	artist: BaseItemDto,
): Promise<BaseItemDto[]> {
	console.debug('Fetching artist featured on')

	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		getItemsApi(api)
			.getItems({
				parentId: libraryId,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				recursive: true,
				excludeItemIds: [artist.Id!],
				sortBy: [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName],
				sortOrder: [SortOrder.Descending],
				contributingArtistIds: [artist.Id!],
			})
			.then((response) => {
				return response.data.Items ? resolve(response.data.Items) : resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}
