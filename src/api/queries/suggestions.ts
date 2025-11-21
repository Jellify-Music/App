import { BaseItemDto, BaseItemKind, ItemFields } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyUser } from '../../types/JellifyUser'
import { nitroFetch } from '../utils/nitro'

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
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User has not been set')
	if (isUndefined(libraryId)) throw new Error('Library has not been set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			ParentId: libraryId,
			UserId: user.id,
			Recursive: true,
			Limit: 10,
			IncludeItemTypes: [
				BaseItemKind.MusicArtist,
				BaseItemKind.Playlist,
				BaseItemKind.Audio,
				BaseItemKind.MusicAlbum,
			],
			SortBy: ['IsFavoriteOrLiked', 'Random'],
			Fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function fetchArtistSuggestions(
	api: Api | undefined,
	user: JellifyUser | undefined,
	libraryId: string | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User has not been set')
	if (isUndefined(libraryId)) throw new Error('Library has not been set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Artists/AlbumArtists', {
			ParentId: libraryId,
			UserId: user.id,
			Limit: 50,
			StartIndex: page * 50,
			Fields: [ItemFields.ChildCount, ItemFields.SortName, ItemFields.Genres],
			SortBy: ['Random'],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
