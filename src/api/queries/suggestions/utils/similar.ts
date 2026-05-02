import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { ApiLimits } from '../../../../configs/query.config'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyUser } from '../../../../types/JellifyUser'
import { getApi } from '../../../../stores'

export default function fetchSimilarArtists(
	user: JellifyUser | undefined,
	itemId: string,
	limit: number = ApiLimits.Similar,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (isUndefined(api)) return reject('Client has not been set')
		if (isUndefined(user)) return reject('User has not been set')

		getLibraryApi(api)
			.getSimilarArtists({
				userId: user.id,
				itemId: itemId,
				limit,
			})
			.then(({ data }) => {
				resolve(data.Items ?? [])
			})
			.catch((error) => {
				reject(error)
			})
	})
}

export function fetchSimilarItems(
	user: JellifyUser | undefined,
	itemId: string,
	limit: number = ApiLimits.Similar,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		const api = getApi()

		if (isUndefined(api)) return reject('Client has not been set')
		if (isUndefined(user)) return reject('User has not been set')

		getLibraryApi(api)
			.getSimilarItems({
				userId: user.id,
				itemId: itemId,
				limit,
			})
			.then(({ data }) => {
				resolve(data.Items ?? [])
			})
			.catch((error) => {
				reject(error)
			})
	})
}
