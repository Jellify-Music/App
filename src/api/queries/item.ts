import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { groupBy, isEmpty, isEqual, isUndefined } from 'lodash'
import { SectionList } from 'react-native'
import { Api } from '@jellyfin/sdk/lib/api'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import QueryConfig from './query.config'
import { JellifyUser } from '../../types/JellifyUser'

/**
 * Fetches a single Jellyfin item by it's ID
 * @param itemId The ID of the item to fetch
 * @returns The item - a {@link BaseItemDto}
 */
export async function fetchItem(api: Api | undefined, itemId: string): Promise<BaseItemDto> {
	console.debug('Fetching item by id')
	return new Promise((resolve, reject) => {
		if (isEmpty(itemId)) return reject('No item ID proviced')
		if (isUndefined(api)) return reject('Client not initialized')

		getItemsApi(api)
			.getItems({
				ids: [itemId],
				fields: [ItemFields.Tags, ItemFields.Genres],
				enableUserData: true,
			})
			.then((response) => {
				if (response.data.Items && response.data.TotalRecordCount == 1)
					resolve(response.data.Items[0])
				else reject(`${response.data.TotalRecordCount} items returned for ID`)
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches a list of Jellyfin {@link BaseItemDto}s from the library
 * @param api The Jellyfin {@link Api} instance
 * @param library The selected Jellyfin {@link JellifyLibrary}
 * @param page The page number to fetch
 * @param columns The number of columns to fetch
 * @param sortBy The field to sort by
 * @param sortOrder The order to sort by
 * @returns A list of {@link BaseItemDto}s
 */
export async function fetchItems(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	types: BaseItemKind[],
	page: number = 0,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
	isFavorite?: boolean | undefined,
	parentId?: string | undefined,
	ids?: string[] | undefined,
): Promise<{ title: string | number; data: BaseItemDto[] }> {
	console.debug('Fetching items', page)
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client not initialized')
		if (isUndefined(user)) return reject('User not initialized')
		if (isUndefined(library)) return reject('Library not initialized')

		getItemsApi(api)
			.getItems({
				parentId: parentId ?? library.musicLibraryId,
				userId: user.id,
				includeItemTypes: types,
				sortBy,
				recursive: true,
				sortOrder,
				fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
				startIndex: typeof page === 'number' ? page * QueryConfig.limits.library : 0,
				limit: QueryConfig.limits.library,
				isFavorite,
				ids,
			})
			.then(({ data }) => {
				resolve({ title: page, data: data.Items ?? [] })
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches tracks for an album, sectioned into discs for display in a {@link SectionList}
 * @param album The album to fetch tracks for
 * @returns An array of {@link Section}s, where each section title is the disc number,
 * and the data is the disc tracks - an array of {@link BaseItemDto}s
 */
export async function fetchAlbumDiscs(
	api: Api | undefined,
	album: BaseItemDto,
): Promise<{ title: string; data: BaseItemDto[] }[]> {
	console.debug('Fetching album discs')
	return new Promise<{ title: string; data: BaseItemDto[] }[]>((resolve, reject) => {
		if (isEmpty(album.Id)) return reject('No album ID provided')
		if (isUndefined(api)) return reject('Client not initialized')

		let sortBy: ItemSortBy[] = []

		sortBy = [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber, ItemSortBy.SortName]

		getItemsApi(api)
			.getItems({
				parentId: album.Id!,
				sortBy,
			})
			.then(({ data }) => {
				const discs = data.Items
					? Object.keys(groupBy(data.Items, (track) => track.ParentIndexNumber)).map(
							(discNumber) => {
								return {
									title: discNumber,
									data: data.Items!.filter((track: BaseItemDto) =>
										track.ParentIndexNumber
											? isEqual(
													discNumber,
													(track.ParentIndexNumber ?? 0).toString(),
												)
											: track,
									),
								}
							},
						)
					: [{ title: '1', data: [] }]

				resolve(discs)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
