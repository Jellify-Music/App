import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { nitroFetch } from '../../../utils/nitro'
import { isUndefined } from 'lodash'
import { ApiLimits } from '../../../../configs/query.config'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models'

export function fetchGenres(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
): Promise<BaseItemDto[]> {
	return new Promise<BaseItemDto[]>((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Genres', {
			ParentId: library.musicLibraryId,
			UserId: user.id,
			SortBy: [ItemSortBy.SortName],
			SortOrder: [SortOrder.Ascending],
			Recursive: true,
			Fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.ItemCounts],
			StartIndex: pageParam * ApiLimits.Library,
			Limit: ApiLimits.Library,
		})
			.then((data) => {
				if (data.Items) return resolve(data.Items)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
