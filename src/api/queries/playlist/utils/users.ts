//playlist id

import { getApi, getUser } from '@/src/stores'
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api'

//get playlist users
export async function getPlaylistUsers(playlistId: string) {
	//use api
	const api = getApi()

	if (!api) {
		throw new Error('API Instance not set')
	}

	const playlist = getPlaylistsApi(api)

	return await playlist.getPlaylistUsers({ playlistId })
}

//also need user id for add and remove user functions

export async function addPlaylistUser(playlistId: string, userId: string, CanEdit: boolean) {
	//use api
	const api = getApi()
	const playlist = getPlaylistsApi(api!)

	//use dto
	return await playlist.updatePlaylist({
		playlistId,
		updatePlaylistDto: {
			Users: [
				{
					UserId: userId,
					CanEdit,
				},
			],
		},
	})
}

export async function removePlaylistUser(playlistId: string, userId: string) {
	//use api
	const api = getApi()
	const playlist = getPlaylistsApi(api!)

	return await playlist.removeUserFromPlaylist({
		playlistId,
		userId,
	})
}
