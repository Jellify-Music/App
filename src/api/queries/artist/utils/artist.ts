import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk/lib/api'
import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/query.config'
import { setQueryUserDataForItems } from '../../user-data'
import { getApi } from '../../../../stores'

export function fetchArtists(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		getArtistsApi(api)
			.getAlbumArtists({
				parentId: library.musicLibraryId,
				userId: user.id,
				sortBy: sortBy,
				sortOrder: sortOrder,
				startIndex: page * ApiLimits.Library,
				limit: ApiLimits.Library,
				isFavorite: isFavorite,
				fields: [ItemFields.SortName, ItemFields.Genres],
				enableImages: true,
				enableImageTypes: [ImageType.Backdrop, ImageType.Primary],
				imageTypeLimit: 1,
				enableUserData: true,
			})
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
 * Fetches all albums for an artist
 * @param libraryId The ID of the library to fetch albums from
 * @param artist The artist to fetch albums for
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistAlbums(
	libraryId: string | undefined,
	artist: BaseItemDto,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

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
				albumArtistIds: [artist.Id!],
				fields: [ItemFields.ChildCount],
				enableUserData: true,
			})
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
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistFeaturedOn(
	libraryId: string | undefined,
	artist: BaseItemDto,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

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
				fields: [ItemFields.ParentId, ItemFields.ChildCount],
				enableUserData: true,
			})
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
