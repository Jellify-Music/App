import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import QueryConfig from './query.config'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyUser } from '../../types/JellifyUser'

export default function fetchSimilar(
	api: Api | undefined,
	user: JellifyUser | undefined,
	libraryId: string | undefined,
	itemId: string,
	limit: number = QueryConfig.limits.similar,
	startIndex: number = 0,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client has not been set')
		if (isUndefined(user)) return reject('User has not been set')
		if (isUndefined(libraryId)) return reject('Library has not been set')

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
