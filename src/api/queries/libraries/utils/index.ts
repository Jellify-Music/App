import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { Api } from '@jellyfin/sdk'
import { JellifyUser } from '../../../../types/JellifyUser'

export async function fetchPlaylistLibrary(
	api: Api,
	user: JellifyUser,
	signal?: AbortSignal,
): Promise<BaseItemDto | undefined> {
	return new Promise((resolve, reject) => {
		getLibraryApi(api)
			.getItems(
				{
					userId: user.id,
					includeItemTypes: ['ManualPlaylistsFolder'],
					excludeItemTypes: ['CollectionFolder'],
				},
				{
					signal,
				},
			)
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
	api: Api,
	user: JellifyUser,
	signal?: AbortSignal,
): Promise<BaseItemDto[] | void> {
	return new Promise((resolve, reject) => {
		getUserViewApi(api)
			.getUserViews(
				{
					userId: user.id,
				},
				{
					signal,
				},
			)
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
