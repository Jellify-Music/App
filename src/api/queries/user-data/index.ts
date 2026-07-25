import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { ONE_MINUTE, queryClient } from '../../../constants/query-client'
import { getUser } from '../../../stores/auth/utils'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'

export const useIsFavorite = (item: BaseItemDto) => {
	const user = getUser()

	return useQuery({
		queryKey: UserDataQueryKey(user!, item.Id!),
		queryFn: () => fetchUserData(item.Id!),
		select: ({ IsFavorite }) => IsFavorite || false,
		enabled: !!item.Id, // Only run if we have the required data
		staleTime: ONE_MINUTE * 15,
	})
}

export function setQueryUserDataForItems(items: BaseItemDto[]) {
	const user = getUser()

	if (!user) {
		console.error('No user found in store')
		return
	}

	items.forEach((item) => {
		if (!item.UserData) return

		queryClient.setQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id!), () => {
			return item.UserData
		})
	})
}

export function setQueryUserDataForItem(item: BaseItemDto, userItemData?: UserItemDataDto) {
	const user = getUser()

	const userData = userItemData || item.UserData

	if (!user) {
		console.error('No user found in store')
		return
	}

	if (!userData) return

	queryClient.setQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id!), (oldData) => {
		return userData
	})
}
