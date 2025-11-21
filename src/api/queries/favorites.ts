import { JellifyLibrary } from '../../../src/types/JellifyLibrary'
import { JellifyUser } from '../../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { nitroFetch } from '../utils/nitro'

/**
 * Fetches the {@link BaseItemDto}s that are marked as favorite artists
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @returns The {@link BaseItemDto}s that are marked as favorite artists
 */
export async function fetchFavoriteArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
): Promise<BaseItemDto[]> {
	console.debug(`Fetching user's favorite artists`)

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: [BaseItemKind.MusicArtist],
			IsFavorite: true,
			ParentId: library.musicLibraryId,
			Recursive: true,
			SortBy: [ItemSortBy.SortName],
			SortOrder: [SortOrder.Ascending],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Fetches the {@link BaseItemDto}s that are marked as favorite albums
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @returns The {@link BaseItemDto}s that are marked as favorite albums
 */
export async function fetchFavoriteAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
): Promise<BaseItemDto[]> {
	console.debug(`Fetching user's favorite albums`)

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: [BaseItemKind.MusicAlbum],
			IsFavorite: true,
			ParentId: library.musicLibraryId!,
			Recursive: true,
			SortBy: [ItemSortBy.DatePlayed, ItemSortBy.SortName],
			SortOrder: [SortOrder.Descending, SortOrder.Ascending],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Fetches the {@link BaseItemDto}s that are marked as favorite playlists
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @returns The {@link BaseItemDto}s that are marked as favorite playlists
 */
export async function fetchFavoritePlaylists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
): Promise<BaseItemDto[]> {
	console.debug(`Fetching user's favorite playlists`)

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			UserId: user.id,
			ParentId: library.playlistLibraryId,
			Fields: ['Path'],
			SortBy: [ItemSortBy.SortName],
			SortOrder: [SortOrder.Ascending],
		})

		if (response.Items) {
			return response.Items.filter(
				(item) => item.UserData?.IsFavorite || item.Path?.includes('/data/playlists'),
			)
		}
		return []
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Fetches the {@link BaseItemDto}s that are marked as favorite tracks
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @returns The {@link BaseItemDto}s that are marked as favorite tracks
 */
export async function fetchFavoriteTracks(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
): Promise<BaseItemDto[]> {
	console.debug(`Fetching user's favorite tracks`)

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: [BaseItemKind.Audio],
			IsFavorite: true,
			ParentId: library.musicLibraryId,
			Recursive: true,
			SortBy: [ItemSortBy.SortName],
			SortOrder: [SortOrder.Ascending],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
