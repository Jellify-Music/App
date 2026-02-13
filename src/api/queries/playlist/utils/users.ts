//playlist id

import { getApi, getUser } from '@/src/stores'
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api'

//get playlist users
function getPlaylistUsers(playlistId: string) {
	//use api
	const api = getApi()
	//const user = getUser();
	const playlist = getPlaylistsApi(api!)

	return playlist.getPlaylistUsers({ playlistId })
}

//also need user id for add and remove user functions

function addPlaylistUser(playlistId: string, userId: string, CanEdit: boolean) {
	//use api
	const api = getApi()
	const playlist = getPlaylistsApi(api!)

	//use dto
	return playlist.updatePlaylist({
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

function removePlaylistUser(playlistId: string, userId: string) {
	//use api
	const api = getApi()
	const playlist = getPlaylistsApi(api!)

	return playlist.removeUserFromPlaylist({
		playlistId,
		userId,
	})
}
