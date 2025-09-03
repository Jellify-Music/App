import { useJellifyContext } from '../../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { ONE_MINUTE } from '@/src/constants/query-client'

export const useIsFavorite = (item: BaseItemDto) => {
	const { api, user } = useJellifyContext()

	return useQuery({
		queryKey: UserDataQueryKey(user!, item),
		queryFn: () => fetchUserData(api, user, item.Id!),
		select: (data) => typeof data === 'object' && data.IsFavorite,
		enabled: !!api && !!user && !!item.Id, // Only run if we have the required data
	})
}
