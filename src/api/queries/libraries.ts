import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { isUndefined } from 'lodash'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../types/JellifyUser'

export async function fetchMusicLibraries(api: Api | undefined): Promise<BaseItemDto[] | void> {
	console.debug('Fetching music libraries from Jellyfin')

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')

		getItemsApi(api)
			.getItems({
				includeItemTypes: ['CollectionFolder'],
			})
			.then((response) => {
				if (response.data.Items) return resolve(response.data.Items)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}

export async function fetchPlaylistLibrary(api: Api | undefined): Promise<BaseItemDto | undefined> {
	console.debug('Fetching playlist library from Jellyfin')

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')

		getItemsApi(api)
			.getItems({
				includeItemTypes: ['ManualPlaylistsFolder'],
				excludeItemTypes: ['CollectionFolder'],
			})
			.then((response) => {
				if (response.data.Items)
					return resolve(
						response.data.Items.filter(
							(library) => library.CollectionType == 'playlists',
						)[0],
					)
				else return resolve(undefined)
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}

export async function fetchUserViews(
	api: Api | undefined,
	user: JellifyUser | undefined,
): Promise<BaseItemDto[] | void> {
	console.debug('Fetching user views')

	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		getUserViewsApi(api)
			.getUserViews({
				userId: user.id,
			})
			.then((response) => {
				if (response.data.Items) return resolve(response.data.Items)
				else return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
