import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import QueryConfig, { ApiLimits } from '../../../../configs/query.config'
import { setQueryUserDataForItems } from '../../user-data'
import { ensurePlaylistLibraryQueryData } from '../../libraries'
import { captureError, LoggingContext } from '../../../../utils/logging'

/**
 * Returns the user's playlists from the Jellyfin server
 *
 * Performs filtering to ensure that these are playlists stored in the
 * config directory of Jellyfin, as to avoid displaying .m3u files from
 * the library
 *
 * @param api The {@link Api} instance from the {@link useApi} hook
 * @param user The {@link JellifyUser} instance from the {@link useJellifyUser} hook
 * @param library The {@link BaseItemDto} instance from the {@link usePlaylistLibrary} hook
 * @param sortBy An array of {@link ItemSortBy} values to sort the response by
 * @returns
 */
export async function fetchUserPlaylists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	sortBy: ItemSortBy[] = [],
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) return Promise.reject('Client instance not set')
	if (isUndefined(user)) return Promise.reject('User instance not set')

	const playlistLibrary = await ensurePlaylistLibraryQueryData()

	if (isUndefined(playlistLibrary)) return Promise.reject('Library instance not set')

	try {
		const { data } = await getItemsApi(api).getItems({
			userId: user.id,
			parentId: playlistLibrary.Id!,
			fields: [
				ItemFields.Path,
				ItemFields.CanDelete,
				ItemFields.Genres,
				ItemFields.ChildCount,
				ItemFields.ItemCounts,
			],
			sortBy: [ItemSortBy.SortName],
			sortOrder: [SortOrder.Ascending],
			limit: QueryConfig.limits.library,
			enableUserData: true,
		})

		if (data.Items) {
			const playlists = data.Items.filter((playlist) => playlist.Path?.includes('data'))
			setQueryUserDataForItems(playlists)
			return playlists
		} else return []
	} catch (error) {
		captureError(error, LoggingContext.Playlist, 'Failed to fetch user playlists')
		return Promise.reject(error)
	}
}

export async function fetchPublicPlaylists(
	api: Api | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) return Promise.reject('Client instance not set')

	const playlistLibrary = await ensurePlaylistLibraryQueryData()

	if (isUndefined(playlistLibrary)) return Promise.reject('Library instance not set')

	try {
		const { data } = await getItemsApi(api).getItems({
			parentId: playlistLibrary.Id!,
			sortBy: [ItemSortBy.IsFavoriteOrLiked, ItemSortBy.Random],
			sortOrder: [SortOrder.Ascending],
			startIndex: page * QueryConfig.limits.library,
			limit: QueryConfig.limits.library,
			fields: [
				ItemFields.Path,
				ItemFields.CanDelete,
				ItemFields.Genres,
				ItemFields.ChildCount,
				ItemFields.ItemCounts,
			],
			enableUserData: true,
		})

		if (data.Items) {
			// Playlists must not be stored in Jellyfin's internal config directory
			const playlists = data.Items.filter((playlist) => !playlist.Path?.includes('data'))
			setQueryUserDataForItems(playlists)
			return playlists
		} else return []
	} catch (error) {
		console.error(error)
		return Promise.reject(error)
	}
}

/**
 * Fetches tracks for a playlist with pagination using NitroFetch
 * for optimized JSON parsing on a background thread.
 *
 * @param api The {@link Api} instance
 * @param playlistId The ID of the playlist to fetch tracks for
 * @param pageParam The page number for pagination (0-indexed)
 * @returns Array of tracks for the playlist
 */
export async function fetchPlaylistTracks(
	api: Api | undefined,
	playlistId: string,
	pageParam: number = 0,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) {
		throw new Error('Client instance not set')
	}

	const response = await getItemsApi(api).getItems({
		parentId: playlistId,
		includeItemTypes: [BaseItemKind.Audio],
		recursive: false,
		limit: ApiLimits.Library,
		startIndex: pageParam * ApiLimits.Library,
		fields: [
			ItemFields.MediaSources,
			ItemFields.ParentId,
			ItemFields.Path,
			ItemFields.SortName,
		],
	})

	return response.data.Items ?? []
}
