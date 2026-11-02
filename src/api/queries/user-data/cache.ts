import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { queryClient } from '../../client'
import { getUser } from '../../../stores/auth/utils'
import UserDataQueryKey from './keys'

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

	queryClient.setQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id), () => {
		return userData
	})
}
