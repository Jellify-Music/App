import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../../../types/JellifyUser'

export async function fetchPlaylistLibrary(
	api: Api,
	user: JellifyUser,
): Promise<BaseItemDto | undefined> {
	return new Promise((resolve, reject) => {
		getItemsApi(api)
			.getItems({
				userId: user.id,
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

export async function fetchUserViews(api: Api, user: JellifyUser): Promise<BaseItemDto[] | void> {
	return new Promise((resolve, reject) => {
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
