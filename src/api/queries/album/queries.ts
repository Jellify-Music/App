import { ONE_DAY } from '../../../constants/query-client'
import { getApi } from '../../../stores'
import { fetchItem } from '../item'
import { AlbumQueryKey } from './keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

export const AlbumQuery = (album: BaseItemDto) => {
	const api = getApi()

	return {
		queryKey: AlbumQueryKey(album),
		queryFn: () => fetchItem(api, album.Id!),
		enabled: !!album.Id && !!api,
		staleTime: ONE_DAY,
	}
}
