import { JellifyLibrary } from '../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import QueryConfig from './query.config'
import { JellifyUser } from '../../types/JellifyUser'

export function fetchTracks(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy = ItemSortBy.SortName,
	sortOrder: SortOrder = SortOrder.Ascending,
) {
	console.debug('Fetching tracks', isFavorite)
	return new Promise<BaseItemDto[]>((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		getItemsApi(api)
			.getItems({
				includeItemTypes: [BaseItemKind.Audio],
				parentId: library.musicLibraryId,
				userId: user.id,
				recursive: true,
				isFavorite: isFavorite,
				limit: QueryConfig.limits.library,
				startIndex: pageParam * QueryConfig.limits.library,
				sortBy: [sortBy],
				sortOrder: [sortOrder],
			})
			.then((response) => {
				console.debug(`Received favorite artist response`, response)

				if (response.data.Items) return resolve(response.data.Items)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
