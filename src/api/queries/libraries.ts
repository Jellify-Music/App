import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { isUndefined } from 'lodash'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../types/JellifyUser'
import { nitroFetch } from '../utils/nitro'

export async function fetchMusicLibraries(api: Api | undefined): Promise<BaseItemDto[] | void> {
	console.debug('Fetching music libraries from Jellyfin')

	if (isUndefined(api)) throw new Error('Client instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: ['CollectionFolder'],
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function fetchPlaylistLibrary(api: Api | undefined): Promise<BaseItemDto | undefined> {
	console.debug('Fetching playlist library from Jellyfin')

	if (isUndefined(api)) throw new Error('Client instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: ['ManualPlaylistsFolder'],
			ExcludeItemTypes: ['CollectionFolder'],
		})
		return (
			response.Items?.filter((library) => library.CollectionType == 'playlists')[0] ||
			undefined
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function fetchUserViews(
	api: Api | undefined,
	user: JellifyUser | undefined,
): Promise<BaseItemDto[] | void> {
	console.debug('Fetching user views')

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, `/Users/${user.id}/Views`)
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
