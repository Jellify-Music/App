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
import { ApiLimits } from '../../../../configs/query.config'
import buildYearsParam from '../../../../utils/mapping/build-years-param'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { setQueryUserDataForItems } from '../../user-data'

export function fetchAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
	yearMin?: number,
	yearMax?: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		const yearsParam = buildYearsParam(yearMin, yearMax)

		getItemsApi(api)
			.getItems({
				parentId: library.musicLibraryId,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.id,
				sortBy: sortBy,
				sortOrder: sortOrder,
				startIndex: page * ApiLimits.Library,
				limit: ApiLimits.Library,
				isFavorite: isFavorite,
				fields: [ItemFields.SortName],
				recursive: true,
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

export function fetchAlbumById(api: Api | undefined, albumId: string): Promise<BaseItemDto> {
	return new Promise((resolve, reject) => {
		fetchItem(api, albumId)
			.then((item) => {
				resolve(item)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
