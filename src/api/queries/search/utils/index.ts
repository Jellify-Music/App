import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { isEmpty, isUndefined, trim } from 'lodash'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { getApi, getUser } from '../../../../stores/auth/utils'
/**
 * Performs a search for items against the Jellyfin server, trimming whitespace
 * around the search term for the best possible results.
 * @param searchString The search term to look up against
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise of a BaseItemDto array, be it empty or not
 */
export async function fetchSearchResults(
	libraryId: string | undefined,
	searchString: string | undefined,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()
		const user = getUser()

		if (isEmpty(searchString)) resolve([])

		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User has not been set')

		getLibraryApi(api)
			.getItems(
				{
					parentId: libraryId,
					userId: user.id,
					searchTerm: trim(searchString),
					recursive: true,
					includeItemTypes: ['MusicArtist', 'Audio', 'MusicAlbum', 'Playlist'],
					limit: ApiLimits.Search,
					sortBy: ['IsFolder'],
					sortOrder: ['Descending'],
					enableUserData: true,
				},
				{
					signal,
				},
			)
			.then((response) => {
				if (response.data.Items) {
					resolve(response.data.Items)
				} else {
					resolve([])
				}
			})
			.catch((error) => {
				reject(error)
			})
	})
}
