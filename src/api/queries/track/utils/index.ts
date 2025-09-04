import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import { ApiLimits } from '../../query.config'
import { JellifyUser } from '../../../../types/JellifyUser'

export default function fetchTracks(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy = ItemSortBy.SortName,
	sortOrder: SortOrder = SortOrder.Ascending,
) {
	console.debug('Fetching tracks', pageParam)
	return new Promise<BaseItemDto[]>((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		getItemsApi(api)
			.getItems({
				includeItemTypes: [BaseItemKind.Audio],
				parentId: library.musicLibraryId,
				enableUserData: true,
				userId: user.id,
				recursive: true,
				isFavorite: isFavorite,
				limit: ApiLimits.Library,
				startIndex: pageParam * ApiLimits.Library,
				sortBy: [sortBy],
				sortOrder: [sortOrder],
				fields: [ItemFields.SortName],
			})
			.then((response) => {
				if (response.data.Items) return resolve(response.data.Items)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
