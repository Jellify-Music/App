import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { fetchItem } from '../../item'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/querying/index.config'
import buildYearsParam from '../../../../utils/mapping/build-years-param'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { setQueryUserDataForItems } from '../../user-data'

export function fetchAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		const yearsParam = buildYearsParam(yearMin, yearMax)

		getItemsApi(api)
			.getItems(
				{
					parentId: library.musicLibraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					userId: user.id,
					sortBy: sortBy,
					sortOrder: sortOrder,
					startIndex: page * ApiLimits.Library,
					limit: ApiLimits.Library,
					isFavorite: isFavorite,
					fields: [ItemFields.SortName],
					recursive: true,
					years: yearsParam,
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
				console.error(error)
				return reject(error)
			})
	})
}

/**
 * Resolves the number of albums sorted before the given letter, so the A-Z
 * scroller can compute which page that letter falls on without paginating
 * through every page in between
 * @param api The Jellyfin API instance
 * @param user The user requesting the count
 * @param library The library to count albums from
 * @param letter The letter to count albums before
 * @param isFavorite Whether to only count favorited albums
 * @param yearMin Optional minimum year filter
 * @param yearMax Optional maximum year filter
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to the number of albums sorted before the letter
 */
export function fetchAlbumsCountBeforeLetter(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	letter: string,
	isFavorite: boolean | undefined,
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
): Promise<number> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		// '#' is the first section in the alphabet selector, so nothing precedes it
		if (letter === '#') return resolve(0)

		const yearsParam = buildYearsParam(yearMin, yearMax)

		getItemsApi(api)
			.getItems(
				{
					parentId: library.musicLibraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					userId: user.id,
					nameLessThan: letter,
					startIndex: 0,
					limit: 1,
					isFavorite: isFavorite,
					recursive: true,
					years: yearsParam,
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

export function fetchAlbumById(
	api: Api | undefined,
	albumId: string,
	signal?: AbortSignal,
): Promise<BaseItemDto> {
	return new Promise((resolve, reject) => {
		fetchItem(api, albumId, signal)
			.then((item) => {
				resolve(item)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
