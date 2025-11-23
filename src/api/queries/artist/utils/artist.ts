import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk/lib/api'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/query.config'
import { nitroFetch } from '../../../utils/nitro'

export function fetchArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Artists/AlbumArtists', {
			ParentId: library.musicLibraryId,
			UserId: user.id,
			EnableUserData: true,
			SortBy: sortBy,
			SortOrder: sortOrder,
			StartIndex: page * ApiLimits.Library,
			Limit: ApiLimits.Library,
			IsFavorite: isFavorite,
			Fields: [ItemFields.SortName, ItemFields.Genres],
		})
			.then((data) => {
				console.debug('Artists Response received')
				return data.Items ? resolve(data.Items) : resolve([])
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
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		nitroFetch<{ Items: BaseItemDto[] }>(api!, '/Items', {
			ParentId: libraryId,
			IncludeItemTypes: [BaseItemKind.MusicAlbum],
			Recursive: true,
			ExcludeItemIds: [artist.Id!],
			SortBy: [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName],
			SortOrder: [SortOrder.Descending],
			AlbumArtistIds: [artist.Id!],
			Fields: [ItemFields.ChildCount],
		})
			.then((data) => {
				return data.Items ? resolve(data.Items) : resolve([])
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
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!libraryId) return reject('Library has not been set')

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			ParentId: libraryId,
			IncludeItemTypes: [BaseItemKind.MusicAlbum],
			Recursive: true,
			ExcludeItemIds: [artist.Id!],
			SortBy: [ItemSortBy.PremiereDate, ItemSortBy.ProductionYear, ItemSortBy.SortName],
			SortOrder: [SortOrder.Descending],
			ContributingArtistIds: [artist.Id!],
		})
			.then((data) => {
				return data.Items ? resolve(data.Items) : resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}
