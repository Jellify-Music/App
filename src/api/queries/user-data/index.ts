import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { ONE_MINUTE } from '../../../constants/query-client'
import { getUser } from '../../../stores'

export const useIsFavorite = (item: BaseItemDto) => {
	const user = getUser()

	return useQuery({
		queryKey: UserDataQueryKey(user!, item),
		queryFn: () => fetchUserData(item.Id!),
		select: (data) => typeof data === 'object' && data.IsFavorite,
		enabled: !!item.Id, // Only run if we have the required data
		staleTime: ONE_MINUTE * 5,
	})
}
