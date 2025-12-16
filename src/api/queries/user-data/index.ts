import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { useApi, useJellifyUser, useAdapter } from '../../../stores'

export const useIsFavorite = (item: BaseItemDto) => {
	const api = useApi()
	const adapter = useAdapter()
	const [user] = useJellifyUser()

	return useQuery({
		queryKey: [...UserDataQueryKey(user!, item), adapter?.backend],
		queryFn: async () => {
			// For Navidrome, check if item is in the starred list
			if (adapter?.backend === 'navidrome') {
				const starred = await adapter.getStarred()
				const isStarred =
					starred.artists.some((a) => a.id === item.Id) ||
					starred.albums.some((a) => a.id === item.Id) ||
					starred.tracks.some((t) => t.id === item.Id)
				return { IsFavorite: isStarred }
			}
			// For Jellyfin, use the existing user data fetch
			return fetchUserData(api, user, item.Id!)
		},
		select: (data) => typeof data === 'object' && data?.IsFavorite,
		enabled: !!adapter && !!item.Id,
	})
}
