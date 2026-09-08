import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemFilter,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { JellifyUser } from '../../../../types/JellifyUser'
import buildYearsParam from '../../../../utils/mapping/build-years-param'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { setQueryUserDataForItems } from '../../user-data'

export default function fetchTracks(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
	isFavorite: boolean | undefined,
	isUnplayed: boolean | undefined,
	sortBy: ItemSortBy = ItemSortBy.SortName,
	sortOrder: SortOrder = SortOrder.Ascending,
	artistId?: string,
	genreIds?: string[],
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
) {
	return new Promise<BaseItemDto[]>((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		// SortName includes track numbers (e.g. "0001 - 0001 - Title"),
		// which breaks alphabetical sorting. We force Name sorting to get a flat A-Z list.
		const finalSortBy = sortBy === ItemSortBy.SortName ? ItemSortBy.Name : sortBy

		// Build filters array based on isFavorite and isUnplayed
		const filters: ItemFilter[] = []
		if (isFavorite === true) {
			filters.push(ItemFilter.IsFavorite)
		}
		if (isUnplayed === true) {
			filters.push(ItemFilter.IsUnplayed)
		}

		const yearsParam = buildYearsParam(yearMin, yearMax)

		getItemsApi(api)
			.getItems(
				{
					includeItemTypes: [BaseItemKind.Audio],
					parentId: library.musicLibraryId,
					userId: user.id,
					recursive: true,
					filters: filters.length > 0 ? filters : undefined,
					limit: ApiLimits.Library,
					startIndex: pageParam * ApiLimits.Library,
					sortBy: [finalSortBy],
					sortOrder: [sortOrder],
					fields: [ItemFields.SortName],
					artistIds: artistId ? [artistId] : undefined,
					genreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
					years: yearsParam,
					enableUserData: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				const items = data.Items ?? []
				setQueryUserDataForItems(items)
				return resolve(items)
			})
			.catch((error) => {
				return reject(error)
			})
	})
}

/**
 * Resolves the number of tracks sorted before the given letter, so the A-Z
 * scroller can compute which page that letter falls on without paginating
 * through every page in between
 * @param api The Jellyfin API instance
 * @param user The user requesting the count
 * @param library The library to count tracks from
 * @param letter The letter to count tracks before
 * @param isFavorite Whether to only count favorited tracks
 * @param isUnplayed Whether to only count unplayed tracks
 * @param genreIds Optional genre ID filter
 * @param yearMin Optional minimum year filter
 * @param yearMax Optional maximum year filter
 * @param signal Optional AbortSignal to cancel the request
 * @returns A promise that resolves to the number of tracks sorted before the letter
 */
export function fetchTracksCountBeforeLetter(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	letter: string,
	isFavorite: boolean | undefined,
	isUnplayed: boolean | undefined,
	genreIds?: string[],
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
): Promise<number> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		// '#' is the first section in the alphabet selector, so nothing precedes it
		if (letter === '#') return resolve(0)

		const filters: ItemFilter[] = []
		if (isFavorite === true) {
			filters.push(ItemFilter.IsFavorite)
		}
		if (isUnplayed === true) {
			filters.push(ItemFilter.IsUnplayed)
		}

		const yearsParam = buildYearsParam(yearMin, yearMax)

		getItemsApi(api)
			.getItems(
				{
					includeItemTypes: [BaseItemKind.Audio],
					parentId: library.musicLibraryId,
					userId: user.id,
					recursive: true,
					filters: filters.length > 0 ? filters : undefined,
					nameLessThan: letter,
					startIndex: 0,
					limit: 1,
					genreIds: genreIds && genreIds.length > 0 ? genreIds : undefined,
					years: yearsParam,
					enableTotalRecordCount: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => resolve(data.TotalRecordCount ?? 0))
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
