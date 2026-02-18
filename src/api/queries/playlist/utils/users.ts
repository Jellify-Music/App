//playlist id

import { getApi, getUser } from '@/src/stores'
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api'

//get playlist users
async function getPlaylistUsers(playlistId: string) {
	//use api
	const api = getApi()

	if (!api) {
		throw new Error('API Instance not set')
	}

	const playlist = getPlaylistsApi(api)

	return await playlist.getPlaylistUsers({ playlistId })
}

//also need user id for add and remove user functions

async function addPlaylistUser(playlistId: string, userId: string, CanEdit: boolean) {
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

async function removePlaylistUser(playlistId: string, userId: string) {
	//use api
	const api = getApi()
	const playlist = getPlaylistsApi(api!)

	return await playlist.removeUserFromPlaylist({
		playlistId,
		userId,
	})
}
