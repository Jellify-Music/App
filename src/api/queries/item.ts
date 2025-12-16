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
import QueryConfig from '../../configs/query.config'
import { JellifyUser } from '../../types/JellifyUser'
import { nitroFetch } from '../utils/nitro'
import { MusicServerAdapter } from '../core/adapter'
import {
	unifiedAlbumToBaseItem,
	unifiedArtistToBaseItem,
	unifiedTrackToBaseItem,
} from '../../utils/unified-conversions'

/**
 * Fetches a single item by its ID using the adapter pattern.
 * Works for both Jellyfin and Navidrome.
 * @param adapter The music server adapter (or undefined for Jellyfin fallback)
 * @param api The Jellyfin API (for Jellyfin fallback)
 * @param itemId The ID of the item to fetch
 * @param itemType Optional hint about the item type (album, artist, track)
 * @returns The item - a {@link BaseItemDto}
 */
export async function fetchItemWithAdapter(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	itemId: string,
	itemType?: 'album' | 'artist' | 'track',
): Promise<BaseItemDto> {
	if (isEmpty(itemId)) throw new Error('No item ID provided')

	// Use adapter for Navidrome
	if (adapter?.backend === 'navidrome') {
		// Try to fetch based on type hint, or try each type
		if (itemType === 'album' || !itemType) {
			try {
				const album = await adapter.getAlbum(itemId)
				return unifiedAlbumToBaseItem(album)
			} catch {
				if (itemType === 'album') throw new Error(`Album not found: ${itemId}`)
			}
		}
		if (itemType === 'artist' || !itemType) {
			try {
				const artist = await adapter.getArtist(itemId)
				return unifiedArtistToBaseItem(artist)
			} catch {
				if (itemType === 'artist') throw new Error(`Artist not found: ${itemId}`)
			}
		}
		if (itemType === 'track' || !itemType) {
			try {
				const track = await adapter.getTrack(itemId)
				return unifiedTrackToBaseItem(track)
			} catch {
				if (itemType === 'track') throw new Error(`Track not found: ${itemId}`)
			}
		}
		throw new Error(`Item not found: ${itemId}`)
	}

	// Fallback to Jellyfin API
	return fetchItem(api, itemId)
}

/**
 * Fetches a single Jellyfin item by it's ID (Jellyfin-only, use fetchItemWithAdapter for adapter support)
 * @param itemId The ID of the item to fetch
 * @returns The item - a {@link BaseItemDto}
 */
export async function fetchItem(api: Api | undefined, itemId: string): Promise<BaseItemDto> {
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
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client not initialized')
		if (isUndefined(user)) return reject('User not initialized')
		if (isUndefined(library)) return reject('Library not initialized')

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			ParentId: parentId ?? library.musicLibraryId,
			UserId: user.id,
			IncludeItemTypes: types,
			SortBy: sortBy,
			Recursive: true,
			SortOrder: sortOrder,
			Fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
			StartIndex: typeof page === 'number' ? page * QueryConfig.limits.library : 0,
			Limit: QueryConfig.limits.library,
			IsFavorite: isFavorite,
			Ids: ids,
		})
			.then((data) => {
				resolve({ title: page, data: data.Items ?? [] })
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches tracks for an album, sectioned into discs for display in a {@link SectionList}
 * Supports both Jellyfin and Navidrome via adapter.
 * @param adapter The music server adapter
 * @param api The Jellyfin API (for fallback)
 * @param album The album to fetch tracks for
 * @returns An array of {@link Section}s, where each section title is the disc number,
 * and the data is the disc tracks - an array of {@link BaseItemDto}s
 */
export async function fetchAlbumDiscsWithAdapter(
	adapter: MusicServerAdapter | undefined,
	api: Api | undefined,
	album: BaseItemDto,
): Promise<{ title: string; data: BaseItemDto[] }[]> {
	if (isEmpty(album.Id)) throw new Error('No album ID provided')

	// Use adapter for Navidrome
	if (adapter?.backend === 'navidrome') {
		const tracks = await adapter.getAlbumTracks(album.Id!)
		// Group by disc number
		const grouped = groupBy(tracks, (t) => t.discNumber ?? 1)
		return Object.keys(grouped).map((discNumber) => ({
			title: discNumber,
			data: grouped[parseInt(discNumber)].map(unifiedTrackToBaseItem),
		}))
	}

	// Fallback to Jellyfin API
	return fetchAlbumDiscs(api, album)
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
	return new Promise<{ title: string; data: BaseItemDto[] }[]>((resolve, reject) => {
		if (isEmpty(album.Id)) return reject('No album ID provided')
		if (isUndefined(api)) return reject('Client not initialized')

		let sortBy: ItemSortBy[] = []

		sortBy = [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber, ItemSortBy.SortName]

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			ParentId: album.Id!,
			SortBy: sortBy,
		})
			.then((data) => {
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
