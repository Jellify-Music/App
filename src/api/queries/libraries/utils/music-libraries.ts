import { Api } from '@jellyfin/sdk'
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { queryClient } from '../../../client'
import { LibrariesQuery } from '../queries'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { getUser } from '../../../../stores/auth/utils'
import { QueryAges } from '../../../../constants/durations'

/**
 * Resolves the IDs of the music libraries a query should cover.
 *
 * Most queries can span every music library by leaving out `parentId`, but some Jellyfin
 * endpoints (genres, latest media, query filters) need one. Those query each library returned
 * here and merge the results.
 *
 * @param api The Jellyfin {@link Api} instance
 * @param library The selected {@link JellifyLibrary}, or `undefined` when none is selected
 * @returns The selected library's ID, or the IDs of every music library the user can access
 */
export async function fetchMusicLibraryIds(
	api: Api,
	library: JellifyLibrary | undefined,
): Promise<string[]> {
	if (!isUndefined(library)) return [library.musicLibraryId]

	const user = getUser()

	if (isUndefined(user)) return []

	const libraries = await queryClient.query({
		...LibrariesQuery(api, user),
		staleTime: QueryAges.OneHour,
	})

	return (libraries ?? [])
		.filter(({ CollectionType: type, Id }) => type === CollectionType.Music && !isUndefined(Id))
		.map(({ Id }) => Id!)
}
