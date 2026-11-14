import { Api } from '@jellyfin/sdk'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { isUndefined, uniq } from 'lodash'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { getFilterApi } from '@jellyfin/sdk/lib/utils/api'
import { fetchMusicLibraryIds } from '../../libraries/utils/music-libraries'

export type ItemsFiltersResponse = {
	Genres?: string[] | null
	Years?: number[] | null
	Tags?: string[] | null
	OfficialRatings?: string[] | null
}

/**
 * Fetches available filter values (genres, years) for the music library via /Items/Filters.
 * Uses MusicAlbum so years reflect album release dates in the library.
 *
 * The filters endpoint needs a library to look in, so when no library is selected
 * each music library is queried and their years are merged.
 *
 * Returns sorted ascending list of year numbers.
 */
export async function fetchLibraryYears(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	userId: string | undefined,
	signal?: AbortSignal,
): Promise<number[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(userId)) throw new Error('User id required')

	const libraryIds = await fetchMusicLibraryIds(library)

	const years = await Promise.all(
		libraryIds.map((parentId) =>
			getFilterApi(api)
				.getQueryFiltersLegacy(
					{
						userId,
						parentId,
						includeItemTypes: [BaseItemKind.MusicAlbum],
					},
					{
						signal,
					},
				)
				.then(({ data }) => data?.Years ?? []),
		),
	)

	return uniq(years.flat())
		.filter((y) => typeof y === 'number' && !Number.isNaN(y))
		.sort((a, b) => a - b)
}
