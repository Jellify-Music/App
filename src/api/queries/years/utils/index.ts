import { Api } from '@jellyfin/sdk'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { nitroFetch } from '../../../utils/nitro'
import { isUndefined } from 'lodash'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'

export type ItemsFiltersResponse = {
	Genres?: string[] | null
	Years?: number[] | null
	Tags?: string[] | null
	OfficialRatings?: string[] | null
}

/**
 * Fetches available filter values (genres, years) for the music library via /Items/Filters.
 * Uses MusicAlbum so years reflect album release dates in the library.
 * Returns sorted ascending list of year numbers.
 */
export async function fetchLibraryYears(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	userId: string | undefined,
): Promise<number[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')
	if (isUndefined(userId)) throw new Error('User id required')

	const data = await nitroFetch<ItemsFiltersResponse>(api, '/Items/Filters', {
		UserId: userId,
		ParentId: library.musicLibraryId,
		IncludeItemTypes: [BaseItemKind.MusicAlbum],
	})

	const years = data?.Years ?? []
	return [...years].filter((y) => typeof y === 'number' && !Number.isNaN(y)).sort((a, b) => a - b)
}
