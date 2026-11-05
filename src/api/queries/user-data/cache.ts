import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client'
import { queryClient } from '../../client'
import { getUser } from '../../../stores/auth/utils'
import UserDataQueryKey from './keys'

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

/**
 * Reads whether an item is a favorite without a mounted query observer.
 *
 * User data is only cached for items that have rendered (see `useIsFavorite`), so an item that
 * hasn't been displayed this session has no cache entry. A cached entry wins when present, since it
 * reflects favorite toggles made in the app; otherwise fall back to the `UserData` carried on the
 * item itself (e.g. the snapshot stored with a downloaded track).
 */
export function getIsFavoriteFromCache(item: BaseItemDto | undefined): boolean {
	const user = getUser()

	if (!user || !item?.Id) return false

	const cached = queryClient.getQueryData<UserItemDataDto>(UserDataQueryKey(user, item.Id))

	return (cached ?? item.UserData)?.IsFavorite ?? false
}
