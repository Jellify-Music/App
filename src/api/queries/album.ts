import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import { fetchItem, fetchItems } from './item'
import { JellifyUser } from '../../types/JellifyUser'
export function fetchAlbums(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: string,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy[] = [ItemSortBy.SortName],
	sortOrder: SortOrder[] = [SortOrder.Ascending],
): Promise<{ title: string | number; data: BaseItemDto[] }> {
	console.debug('Fetching albums', page)

	return fetchItems(
		api,
		user,
		library,
		[BaseItemKind.MusicAlbum],
		page,
		sortBy,
		sortOrder,
		isFavorite,
	)
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
