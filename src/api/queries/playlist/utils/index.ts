import { getApi, getUser } from '../../../../stores/auth/utils'
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
import { ApiLimits } from '../../../../configs/querying/index.config'
import { setQueryUserDataForItems } from '../../user-data'
import { captureError, LoggingContext } from '../../../../utils/logging'
import { ApiNotAvailableError } from '../../../../types/errors'

const PLAYLIST_FIELDS = [
	ItemFields.Path,
	ItemFields.CanDelete,
	ItemFields.Genres,
	ItemFields.ChildCount,
	ItemFields.ItemCounts,
]

/**
 * Returns all of the user's playlists from the Jellyfin server
 *
 * Performs filtering to ensure that these are playlists stored in the
 * config directory of Jellyfin, as to avoid displaying .m3u files from
 * the library
 *
 * @param signal Optional AbortSignal to cancel the request
 * @param user The {@link JellifyUser} to fetch playlists for, defaults to the signed in user
 * @param api The {@link Api} instance, defaults to the current one
 * @returns The user's playlists, sorted by name
 */
export async function fetchUserPlaylists(
	signal?: AbortSignal,
	user: JellifyUser | undefined = getUser(),
	api: Api | undefined = getApi(),
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) return Promise.reject(new ApiNotAvailableError())
	if (isUndefined(user)) return Promise.reject('User instance not set')

	try {
		const { data } = await getItemsApi(api).getItems(
			{
				userId: user.id,
				fields: PLAYLIST_FIELDS,
				includeItemTypes: [BaseItemKind.Playlist],
				recursive: true,
				sortBy: [ItemSortBy.SortName],
				sortOrder: [SortOrder.Ascending],
				enableUserData: true,
			},
			{
				signal,
			},
		)

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

/**
 * Returns all of the playlists shared on the Jellyfin server, favorites first
 *
 * These are playlists stored in the library (i.e. .m3u files) rather
 * than in Jellyfin's config directory
 *
 * @param signal Optional AbortSignal to cancel the request
 * @param api The {@link Api} instance, defaults to the current one
 * @returns The public playlists
 */
export async function fetchPublicPlaylists(
	signal?: AbortSignal,
	api: Api | undefined = getApi(),
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) return Promise.reject(new ApiNotAvailableError())

	try {
		const { data } = await getItemsApi(api).getItems(
			{
				sortBy: [ItemSortBy.IsFavoriteOrLiked, ItemSortBy.Random],
				sortOrder: [SortOrder.Ascending],
				fields: PLAYLIST_FIELDS,
				includeItemTypes: [BaseItemKind.Playlist],
				enableUserData: true,
			},
			{
				signal,
			},
		)

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
 * Fetches every track in a playlist
 *
 * Requested a page at a time to keep each response small, since tracks
 * include their media sources
 *
 * @param playlistId The ID of the playlist to fetch tracks for
 * @param signal Optional AbortSignal to cancel the request
 * @param api The {@link Api} instance, defaults to the current one
 * @returns Array of tracks for the playlist
 */
export async function fetchPlaylistTracks(
	playlistId: string,
	signal?: AbortSignal,
	api: Api | undefined = getApi(),
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) throw new ApiNotAvailableError()

	const tracks: BaseItemDto[] = []

	for (let page = 0; ; page++) {
		const { data } = await getItemsApi(api).getItems(
			{
				parentId: playlistId,
				includeItemTypes: [BaseItemKind.Audio],
				recursive: false,
				limit: ApiLimits.Library,
				startIndex: page * ApiLimits.Library,
				fields: [
					ItemFields.MediaSources,
					ItemFields.ParentId,
					ItemFields.Path,
					ItemFields.SortName,
				],
			},
			{
				signal,
			},
		)

		const items = data.Items ?? []

		tracks.push(...items)

		if (items.length < ApiLimits.Library) return tracks
	}
}
