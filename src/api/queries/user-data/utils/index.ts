import { JellifyUser } from '@/src/types/JellifyUser'
import { Api } from '@jellyfin/sdk/lib/api'
import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client/models/user-item-data-dto'
import { isUndefined } from 'lodash'
import { nitroFetch } from '../../../utils/nitro'

/**
 * Fetches the {@link UserItemDataDto} for a given {@link BaseItemDto}
 * @param api The Jellyfin {@link Api} instance
 * @param itemId The ID field of the {@link BaseItemDto} to fetch user data for
 * @returns The {@link UserItemDataDto} for the given item
 */
export default async function fetchUserData(
	api: Api | undefined,
	user: JellifyUser | undefined,
	itemId: string,
): Promise<UserItemDataDto | void> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')

	try {
		return await nitroFetch<UserItemDataDto>(api, `/Users/${user.id}/Items/${itemId}/UserData`)
	} catch (error) {
		console.error(error)
		throw error
	}
}
