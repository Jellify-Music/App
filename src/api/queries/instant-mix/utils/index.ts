import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getInstantMixApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'
import QueryConfig from '../../../../configs/query.config'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../../../types/JellifyUser'
/**
 * Fetches an instant mix for a given item
 * @param api The Jellyfin {@link Api} instance
 * @param user The Jellyfin {@link JellifyUser} instance
 * @param item The item to fetch an instant mix for
 * @returns A promise of a {@link BaseItemDto} array, be it empty or not
 */
export function fetchInstantMixFromItem(
	api: Api | undefined,
	user: JellifyUser | undefined,
	item: BaseItemDto,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('Client not initialized'))
		if (isUndefined(user)) return reject(new Error('User not initialized'))

		getInstantMixApi(api)
			.getInstantMixFromArtists({
				itemId: item.Id!,
				userId: user.id,
				limit: QueryConfig.limits.instantMix,
			})
			.then(({ data }) => {
				if (data.Items) return resolve(data.Items)
				return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
