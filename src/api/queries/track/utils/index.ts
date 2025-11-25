import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { Api } from '@jellyfin/sdk'
import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { nitroFetch } from '../../../utils/nitro'
import { isUndefined } from 'lodash'
import { ApiLimits } from '../../../../configs/query.config'
import { JellifyUser } from '../../../../types/JellifyUser'

export default function fetchTracks(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	pageParam: number,
	isFavorite: boolean | undefined,
	sortBy: ItemSortBy = ItemSortBy.SortName,
	sortOrder: SortOrder = SortOrder.Ascending,
	artistId?: string,
) {
	return new Promise<BaseItemDto[]>((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		// SortName includes track numbers (e.g. "0001 - 0001 - Title"),
		// which breaks alphabetical sorting. We force Name sorting to get a flat A-Z list.
		const finalSortBy = sortBy === ItemSortBy.SortName ? ItemSortBy.Name : sortBy

		nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: [BaseItemKind.Audio],
			ParentId: library.musicLibraryId,
			EnableUserData: true,
			UserId: user.id,
			Recursive: true,
			IsFavorite: isFavorite,
			Limit: ApiLimits.Library,
			StartIndex: pageParam * ApiLimits.Library,
			SortBy: [finalSortBy],
			SortOrder: [sortOrder],
			Fields: [ItemFields.SortName],
			ArtistIds: artistId ? [artistId] : undefined,
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
