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
import { ApiLimits } from '../../../../configs/query.config'
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
			.getItems({
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
			})
			.then(({ data }) => {
				const items = data.Items ?? []
				setQueryUserDataForItems(items)
				return resolve(items)
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
