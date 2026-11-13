import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { isUndefined, sortBy, uniqBy } from 'lodash'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models'
import { getGenreApi } from '@jellyfin/sdk/lib/utils/api/genre-api'
import { fetchMusicLibraryIds } from '../../libraries/utils/music-libraries'

/**
 * Fetches a page of the genres in the user's music.
 *
 * Genres aren't children of a library folder, so they come from the genres endpoint, scoped
 * with `parentId`. Without a parent that endpoint returns the genres of every library type,
 * so when no library is selected each music library is queried and the pages are merged.
 *
 * @param api The Jellyfin {@link Api} instance
 * @param user The signed in {@link JellifyUser}
 * @param library The selected {@link JellifyLibrary}, or `undefined` for all music libraries
 * @param pageParam The page to fetch
 * @param signal Optional AbortSignal to cancel the request
 * @returns The genres on that page, sorted by name
 */
export async function fetchGenres(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')

	const libraryIds = await fetchMusicLibraryIds(api, library)

	const pages = await Promise.all(
		libraryIds.map((parentId) =>
			getGenreApi(api)
				.getGenres(
					{
						parentId,
						userId: user.id,
						sortBy: [ItemSortBy.SortName],
						sortOrder: [SortOrder.Ascending],
						fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.ItemCounts],
						startIndex: pageParam * ApiLimits.Library,
						limit: ApiLimits.Library,
					},
					{
						signal,
					},
				)
				.then(({ data }) => data.Items ?? []),
		),
	)

	if (pages.length === 1) return pages[0]

	return sortBy(
		uniqBy(pages.flat(), ({ Id }) => Id),
		({ SortName, Name }) => (SortName ?? Name ?? '').toLowerCase(),
	)
}
