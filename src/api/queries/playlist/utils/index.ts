import {
	BaseItemDto,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { JellifyUser } from '../../../../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import QueryConfig from '../../query.config'

/**
 * Returns the user's playlists from the Jellyfin server
 *
 * Performs filtering to ensure that these are playlists stored in the
 * config directory of Jellyfin, as to avoid displaying .m3u files from
 * the library
 *
 * @param api The {@link Api} instance from the {@link useApi} hook
 * @param user The {@link JellifyUser} instance from the {@link useJellifyUser} hook
 * @param library The {@link JellifyLibrary} instance from the {@link useJellifyLibrary} hook
 * @param sortBy An array of {@link ItemSortBy} values to sort the response by
 * @returns
 */
export async function fetchUserPlaylists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	sortBy: ItemSortBy[] = [],
): Promise<BaseItemDto[]> {
	console.debug(
		`Fetching user playlists ${sortBy.length > 0 ? 'sorting by ' + sortBy.toString() : ''}`,
	)

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getItemsApi(api)
			.getItems({
				userId: user.id,
				parentId: library.playlistLibraryId!,
				fields: [
					ItemFields.Path,
					ItemFields.CanDelete,
					ItemFields.Genres,
					ItemFields.ChildCount,
				],
				sortBy: [ItemSortBy.SortName],
				sortOrder: [SortOrder.Ascending],
				limit: QueryConfig.limits.library,
			})
			.then((response) => {
				if (response.data.Items)
					// Playlists must be stored in Jellyfin's internal config directory
					return resolve(
						response.data.Items.filter((playlist) => playlist.Path?.includes('data')),
					)
				else return resolve([])
			})
			.catch((error) => {
				return reject(error)
			})
	})
}

export async function fetchPublicPlaylists(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	console.debug('Fetching public playlists')

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getItemsApi(api)
			.getItems({
				parentId: library.playlistLibraryId!,
				sortBy: [ItemSortBy.IsFavoriteOrLiked, ItemSortBy.Random],
				sortOrder: [SortOrder.Ascending],
				startIndex: page * QueryConfig.limits.library,
				limit: QueryConfig.limits.library,
				fields: ['Path', 'CanDelete', 'Genres'],
			})
			.then((response) => {
				console.log(response)

				if (response.data.Items)
					// Playlists must not be stored in Jellyfin's internal config directory
					return resolve(
						response.data.Items.filter((playlist) => !playlist.Path?.includes('data')),
					)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
