import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { useQuery } from '@tanstack/react-query'
import fetchUserData from './utils'
import UserDataQueryKey from './keys'
import { ONE_MINUTE, queryClient } from '../../../constants/query-client'
import { getUser } from '../../../stores'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'

export const useIsFavorite = (item: BaseItemDto) => {
	const user = getUser()

	return useQuery({
		queryKey: UserDataQueryKey(user!, item.Id!),
		queryFn: () => fetchUserData(item.Id!),
		select: (data) => typeof data === 'object' && data.IsFavorite,
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

		queryClient.setQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id!), (oldData) => {
			if (typeof oldData === 'object' && oldData !== null) {
				return { ...oldData, ...item.UserData }
			}
			// Seed from the DTO so useIsFavorite doesn't need a separate network call
			return item.UserData as UserItemDataDto
		})
	})
}

export function setQueryUserDataForItem(item: BaseItemDto) {
	const user = getUser()

	if (!user) {
		console.error('No user found in store')
		return
	}

	if (!item.UserData) return

	queryClient.setQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id!), (oldData) => {
		if (typeof oldData === 'object' && oldData !== null) {
			return { ...oldData, ...item.UserData }
		}
		// Seed from the DTO so useIsFavorite doesn't need a separate network call
		return item.UserData as UserItemDataDto
	})
}
