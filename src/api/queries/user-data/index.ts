import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import { QueryAges } from '../../../constants/durations'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { getUser } from '../../../stores/auth/utils'

export const useIsFavorite = (item: BaseItemDto) => {
	const user = getUser()

	return useQuery({
		queryKey: UserDataQueryKey(user!, item.Id!),
		queryFn: ({ signal }) => fetchUserData(item.Id!, signal),
		select: ({ IsFavorite }) => IsFavorite || false,
		enabled: Boolean(item.Id),
		staleTime: QueryAges.OneMinute * 15,
	})
}
