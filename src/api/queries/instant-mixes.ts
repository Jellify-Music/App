import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import QueryConfig from '../../configs/query.config'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../types/JellifyUser'
import { nitroFetch } from '../utils/nitro'

/**
 * Fetches an instant mix for a given item
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param item The item to fetch an instant mix for
 * @returns A promise of a {@link BaseItemDto} array, be it empty or not
 */
export async function fetchInstantMixFromItem(
	api: Api | undefined,
	user: JellifyUser | undefined,
	item: BaseItemDto,
): Promise<BaseItemDto[]> {
	console.debug('Fetching instant mix from item')

	if (isUndefined(api)) throw new Error('Client not initialized')
	if (isUndefined(user)) throw new Error('User not initialized')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Artists/InstantMix', {
			UserId: user.id,
			Limit: QueryConfig.limits.instantMix,
			ArtistIds: item.Id!,
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
