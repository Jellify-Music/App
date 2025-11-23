import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { fetchItem, fetchItems } from '../../item'
import { JellifyUser } from '../../../../types/JellifyUser'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { ApiLimits } from '../../../../configs/query.config'
export function fetchAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject('No API instance provided')
		if (!user) return reject('No user provided')
		if (!library) return reject('Library has not been set')

		getItemsApi(api)
			.getItems({
				parentId: library.musicLibraryId,
				includeItemTypes: [BaseItemKind.MusicAlbum],
				userId: user.id,
				enableUserData: true, // This will populate the user data query later down the line
				sortBy,
				sortOrder,
				startIndex: page * ApiLimits.Library,
				limit: ApiLimits.Library,
				isFavorite,
				fields: [ItemFields.SortName],
				recursive: true,
			})
			.then(({ data }) => {
				return data.Items ? resolve(data.Items) : resolve([])
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
