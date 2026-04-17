import { getArtistsApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyUser } from '../../../../types/JellifyUser'

/**
 * Fetches search suggestions from the Jellyfin server
 * @param api The Jellyfin {@link Api} client
 * @returns A promise of a {@link BaseItemDto} array, be it empty or not
 */
export async function fetchSearchSuggestions(
	api: Api | undefined,
	user: JellifyUser | undefined,
	libraryId: string | undefined,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User has not been set')
		if (isUndefined(libraryId)) return reject('Library has not been set')

		getItemsApi(api)
			.getItems({
				parentId: libraryId,
				userId: user.id,
				recursive: true,
				limit: 10,
				includeItemTypes: [
					BaseItemKind.MusicArtist,
					BaseItemKind.Playlist,
					BaseItemKind.Audio,
					BaseItemKind.MusicAlbum,
				],
				sortBy: ['IsFavoriteOrLiked', 'Random'],
				fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
			})
			.then(({ data }) => {
				if (data.Items) resolve(data.Items)
				else resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}

export async function fetchArtistSuggestions(
	api: Api | undefined,
	user: JellifyUser | undefined,
	libraryId: string | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User has not been set')
		if (isUndefined(libraryId)) return reject('Library has not been set')

		getArtistsApi(api)
			.getAlbumArtists({
				parentId: libraryId,
				userId: user.id,
				limit: 50,
				startIndex: page * 50,
				fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
				sortBy: ['Random'],
			})
			.then(({ data }) => {
				if (data.Items) resolve(data.Items)
				else resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}

export async function fetchAlbumSuggestions(
	api: Api | undefined,
	user: JellifyUser | undefined,
	libraryId: string | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User has not been set')
		if (isUndefined(libraryId)) return reject('Library has not been set')

		console.debug(`fetching albums at page ${page}`)

		getItemsApi(api)
			.getItems({
				parentId: libraryId,
				recursive: true,
				userId: user.id,
				limit: 50,
				startIndex: page * 50,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				sortBy: [ItemSortBy.Random, ItemSortBy.SortName],
				sortOrder: [SortOrder.Ascending],
			})
			.then(({ data }) => {
				console.debug(`fetched albums at page ${page}`, data.Items)
				if (data.Items) resolve(data.Items)
				else resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}
