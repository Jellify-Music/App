import { Api } from '@jellyfin/sdk/lib/api'
import { ItemSortBy, MediaType } from '@jellyfin/sdk/lib/generated-client'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'

export default function fetchTopArtistTracks(
	api: Api | undefined,
	libraryId: string | undefined,
	artistId: string | undefined,
): Promise<BaseItemDto[]> {
	if (!libraryId || !artistId || !api) return Promise.resolve([])

	return new Promise<BaseItemDto[]>((resolve, reject) => {
		getItemsApi(api)
			.getItems({
				artistIds: [artistId],
				mediaTypes: [MediaType.Audio],
				parentId: libraryId,
				sortBy: [ItemSortBy.PlayCount, ItemSortBy.Name],
				limit: 3,
			})
			.then(({ data }) => {
				resolve(data.Items || [])
			})
			.catch((error) => {
				console.error('Error fetching top artist tracks:', error)
				reject(error)
			})
	})
}
