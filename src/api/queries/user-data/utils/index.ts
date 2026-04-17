import { getApi, getUser } from '../../../../stores'
import { Api } from '@jellyfin/sdk/lib/api'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models/user-item-data-dto'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { isUndefined } from 'lodash'

/**
 * Fetches the {@link UserItemDataDto} for a given {@link BaseItemDto}
 * @param api The Jellyfin {@link Api} instance
 * @param itemId The ID field of the {@link BaseItemDto} to fetch user data for
 * @returns The {@link UserItemDataDto} for the given item
 */
export default async function fetchUserData(itemId: string): Promise<UserItemDataDto | void> {
	const api = getApi()
	const user = getUser()

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		getItemsApi(api)
			.getItemUserData({
				itemId,
				userId: user.id,
			})
			.then((response) => {
				return resolve(response.data)
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
