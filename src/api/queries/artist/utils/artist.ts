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
import { getArtistApi, getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { getApi } from '../../../../stores/auth/utils'

export function fetchArtists(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')

		getArtistApi(api)
			// The SDK deprecates ArtistApi without a replacement — /Items has no album-artist filter
			// eslint-disable-next-line @typescript-eslint/no-deprecated
			.getAlbumArtists(
				{
					parentId: library?.musicLibraryId,
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
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				const items = data.Items ?? []
				return resolve(items)
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches all albums for an artist
 * @param libraryId The ID of the library to fetch albums from, or `undefined` for all music libraries
 * @param artist The artist to fetch albums for
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to an array of {@link BaseItemDto}s
 */
export function fetchArtistAlbums(
	artist: BaseItemDto,
	libraryId?: string,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')

		getLibraryApi(api)
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
					albumArtistIds: [artist.Id!],
					fields: [ItemFields.ChildCount],
					enableUserData: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				const items = data.Items ?? []
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

		getLibraryApi(api)
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
				return resolve(items)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
