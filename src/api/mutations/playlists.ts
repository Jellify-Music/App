import { JellifyUser } from '../../types/JellifyUser'
import { Api } from '@jellyfin/sdk'
import { BaseItemDto, MediaType } from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi, getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'

/**
 * Adds a track to a Jellyfin playlist.
 *
 * @param api The Jellyfin {@link Api} client
 * @param user The signed in {@link JellifyUser}
 * @param track The {@link BaseItemDto} to add
 * @param playlist The {@link BaseItemDto} playlist to add the track to
 * @returns
 */
export async function addToPlaylist(
	api: Api | undefined,
	user: JellifyUser | undefined,
	track: BaseItemDto,
	playlist: BaseItemDto,
): Promise<void> {
	console.debug('Adding track to playlist')

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		if (isUndefined(user)) return reject(new Error('No user available'))

		console.debug(api)

		console.debug(api.axiosInstance)

		getPlaylistsApi(api)
			.addItemToPlaylist(
				{
					ids: [track.Id!],
					userId: user.id,
					playlistId: playlist.Id!,
				},
				{
					headers: {},
				},
			)
			.then(() => {
				resolve()
			})
			.catch((error) => {
				console.error(error)
				reject(error)
			})
	})
}

/**
 * Removes a track from a Jellyfin playlist.
 *
 * @param api The Jellyfin {@link Api} client
 * @param track The {@link BaseItemDto} to remove
 * @param playlist The {@link BaseItemDto} playlist to remove the track from
 * @returns
 */
export async function removeFromPlaylist(
	api: Api | undefined,
	track: BaseItemDto,
	playlist: BaseItemDto,
) {
	console.debug('Removing track from playlist')

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		getPlaylistsApi(api)
			.removeItemFromPlaylist({
				playlistId: playlist.Id!,
				entryIds: [track.Id!],
			})
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
				console.error(error)
			})
	})
}

/**
 * Reorders a track in a Jellyfin playlist.
 *
 * @param api The Jellyfin {@link Api} client
 * @param playlistId The ID field of the playlist to reorder
 * @param itemId The ID field of the item to reorder
 * @param to The index to move the item to
 * @returns
 */
export async function reorderPlaylist(
	api: Api | undefined,
	playlistId: string,
	itemId: string,
	to: number,
) {
	console.debug(`Moving track to index ${to}`)

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		getPlaylistsApi(api)
			.moveItem({
				playlistId,
				itemId,
				newIndex: to,
			})
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
				console.error(error)
			})
	})
}

/**
 * Creates a new Jellyfin playlist on the server.
 *
 * @param api The Jellyfin {@link Api} client
 * @param user The signed in {@link JellifyUser}
 * @param name The name of the playlist to create
 * @returns
 */
export async function createPlaylist(
	api: Api | undefined,
	user: JellifyUser | undefined,
	name: string,
) {
	console.debug('Creating new playlist...')

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		if (isUndefined(user)) return reject(new Error('No user available'))

		getPlaylistsApi(api)
			.createPlaylist({
				userId: user.id,
				mediaType: MediaType.Audio,
				createPlaylistDto: {
					Name: name,
					IsPublic: false,
					MediaType: MediaType.Audio,
				},
			})
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
				console.error(error)
			})
	})
}

/**
 * Deletes a Jellyfin playlist from the server.
 *
 * @param api The Jellyfin {@link Api} client
 * @param playlistId The ID field of the playlist to delete
 * @returns
 */
export async function deletePlaylist(api: Api | undefined, playlistId: string) {
	console.debug('Deleting playlist...')

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		getLibraryApi(api)
			.deleteItem({
				itemId: playlistId,
			})
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
				console.error(error)
			})
	})
}

/**
 * Updates a Jellyfin playlist with the provided options.
 *
 * Right now this just supports renaming playlists, but this will change
 * when it comes time for collaborative playlists
 *
 * @param playlistId The Jellyfin ID of the playlist to update
 * @returns
 */
export async function updatePlaylist(
	api: Api | undefined,
	playlistId: string,
	name: string,
	trackIds: string[],
) {
	console.debug('Updating playlist')

	return new Promise<void>((resolve, reject) => {
		if (isUndefined(api)) return reject(new Error('No API client available'))

		getPlaylistsApi(api)
			.updatePlaylist({
				playlistId,
				updatePlaylistDto: {
					Name: name,
					Ids: trackIds,
				},
			})
			.then(() => {
				resolve()
			})
			.catch((error) => {
				reject(error)
				console.error(error)
			})
	})
}
