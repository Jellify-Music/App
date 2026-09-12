import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { fetchItem } from '../../item'
import { JellifyUser } from '../../../../types/JellifyUser'
import { ApiLimits } from '../../../../configs/querying/index.config'
import buildYearsParam from '../../../../utils/mapping/build-years-param'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { setQueryUserDataForItems } from '../../user-data'
import { InfiniteSectionListPageParam } from '@/src/api/types/page-param'

/**
 * Maps an AZScroller {@link letter} ('#' or 'A'-'Z') to the `nameStartsWith`/`nameLessThan`
 * filters that select just that letter's albums, so a single bounded request can fetch a
 * letter directly instead of paginating through the whole library to reach it.
 */
function letterNameParams(letter: string): { nameStartsWith?: string; nameLessThan?: string } {
	return letter === '#' ? { nameLessThan: 'A' } : { nameStartsWith: letter }
}

export function fetchAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: InfiniteSectionListPageParam,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		const yearsParam = buildYearsParam(yearMin, yearMax)
		const { nameStartsWith, nameLessThan } = letterNameParams(pageParam.letter)

		const fetchPage = (startIndex: number) =>
			getItemsApi(api).getItems(
				{
					parentId: library.musicLibraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					userId: user.id,
					sortBy: sortBy,
					sortOrder: sortOrder,
					startIndex,
					limit: ApiLimits.Library,
					isFavorite: isFavorite,
					fields: [ItemFields.SortName],
					recursive: true,
					years: yearsParam,
					nameStartsWith,
					nameLessThan,
					enableUserData: true,
				},
				{
					signal,
				},
			)

		// A negative index requests this letter's *last* page (paging backwards across a
		// letter boundary) - resolve it with a count-only lookup rather than paginating
		// forward through the whole letter just to find where it ends.
		const startIndexPromise: Promise<number> =
			pageParam.index >= 0
				? Promise.resolve(pageParam.index)
				: fetchAlbumsCount(
						api,
						user,
						library,
						isFavorite,
						pageParam.letter,
						yearMin,
						yearMax,
						signal,
					).then(
						(count) =>
							Math.max(0, Math.ceil(count / ApiLimits.Library) - 1) *
							ApiLimits.Library,
					)

		startIndexPromise
			.then(fetchPage)
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

/**
 * Fetches the number of albums matching {@link letter} ('#' or 'A'-'Z'), or the total album
 * count when omitted. A `limit: 0` count-only request, used to resolve absolute/last-page
 * indexes without ever fetching the items themselves.
 */
export function fetchAlbumsCount(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	isFavorite: boolean | undefined,
	letter?: string,
	yearMin?: number,
	yearMax?: number,
	signal?: AbortSignal,
): Promise<number> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		const yearsParam = buildYearsParam(yearMin, yearMax)
		const { nameStartsWith, nameLessThan } = letter ? letterNameParams(letter) : {}

		getItemsApi(api)
			.getItems(
				{
					parentId: library.musicLibraryId,
					includeItemTypes: [BaseItemKind.MusicAlbum],
					userId: user.id,
					startIndex: 0,
					limit: 0,
					isFavorite: isFavorite,
					recursive: true,
					years: yearsParam,
					nameStartsWith,
					nameLessThan,
					enableTotalRecordCount: true,
				},
				{
					signal,
				},
			)
			.then(({ data }) => resolve(data.TotalRecordCount ?? 0))
			.catch((error) => {
				reject(error)
			})
	})
}

export function fetchAlbumById(
	api: Api | undefined,
	albumId: string,
	signal?: AbortSignal,
): Promise<BaseItemDto> {
	return new Promise((resolve, reject) => {
		fetchItem(api, albumId, signal)
			.then((item) => {
				resolve(item)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
