//playlist id

import { ApiNotAvailableError } from '../../../../types/errors'
import { getApi } from '../../../../stores/auth/utils'
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api'

/**
 * Fetches the users associated with a specific playlist.
 *
 * @param playlistId The ID of the playlist to fetch users for
 *
 * @returns A list of users associated with the playlist
 */
export async function getPlaylistUsers(playlistId: string) {
	//use api
	const api = getApi()

	if (!api) {
		throw new Error('API Instance not set')
	}

	const playlist = getPlaylistApi(api)

	return (await playlist.getPlaylistUsers({ playlistId })).data
}

/**
 * Adds a user to a specific playlist.
 *
 * @param playlistId The ID of the playlist to add the user to
 * @param userId The ID of the user to add to the playlist
 * @param CanEdit Whether the user can edit the playlist
 *
 * @returns The updated playlist information
 */
export async function addPlaylistUser(playlistId: string, userId: string, CanEdit: boolean) {
	const api = getApi()

	if (!api) throw new ApiNotAvailableError()

	return await getPlaylistApi(api).updatePlaylist({
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
	const api = getApi()

	if (!api) throw new ApiNotAvailableError()

	return await getPlaylistApi(api).removeUserFromPlaylist({
		playlistId,
		userId,
	})
}
