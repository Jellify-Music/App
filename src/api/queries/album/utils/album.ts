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
import { nitroFetch } from '../../../utils/nitro'
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

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			ParentId: library.musicLibraryId,
			IncludeItemTypes: [BaseItemKind.MusicAlbum],
			UserId: user.id,
			EnableUserData: true, // This will populate the user data query later down the line
			SortBy: sortBy,
			SortOrder: sortOrder,
			StartIndex: page * ApiLimits.Library,
			Limit: ApiLimits.Library,
			IsFavorite: isFavorite,
			Fields: [ItemFields.SortName],
			Recursive: true,
		}).then((data) => {
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

export function fetchAlbumsOnThisDay(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	month: number,
	day: number,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (!api || !library) return reject('Api or Library instance not set')
		else
			nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
				ParentId: library.musicLibraryId,
				IncludeItemTypes: [BaseItemKind.MusicAlbum],
				EnableUserData: true, // This will populate the user data query later down the line
				SortBy: [ItemSortBy.ProductionYear],
				SortOrder: [SortOrder.Descending],
				StartIndex: page * ApiLimits.Library,
				Limit: ApiLimits.Library,
				Fields: [ItemFields.SortName],
				Recursive: true,
			}).then(({ Items }) => resolve(Items))
	})
}
