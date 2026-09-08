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
import { ApiLimits } from '../../../../configs/querying/index.config'
import { setQueryUserDataForItems } from '../../user-data'
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
		if (!library) return reject('Library has not been set')

		getArtistsApi(api)
			.getAlbumArtists(
				{
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
 * Resolves the number of artists sorted before the given letter, so the A-Z
 * scroller can compute which page that letter falls on without paginating
 * through every page in between
 * @param user The user requesting the count
 * @param library The library to count artists from
 * @param letter The letter to count artists before
 * @param isFavorite Whether to only count favorited artists
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to the number of artists sorted before the letter
 */
export function fetchArtistsCountBeforeLetter(
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	letter: string,
	isFavorite: boolean | undefined,
	signal?: AbortSignal,
): Promise<number> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (!api) return reject('No API instance provided')
		if (!user) return reject('User has not been set')
		if (!library) return reject('Library has not been set')

		// '#' is the first section in the alphabet selector, so nothing precedes it
		if (letter === '#') return resolve(0)

		getArtistsApi(api)
			.getAlbumArtists(
				{
					parentId: library.musicLibraryId,
					userId: user.id,
					nameLessThan: letter,
					startIndex: 0,
					limit: 1,
					isFavorite: isFavorite,
					enableTotalRecordCount: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => resolve(data.TotalRecordCount ?? 0))
			.catch((error) => reject(error))
	})
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
