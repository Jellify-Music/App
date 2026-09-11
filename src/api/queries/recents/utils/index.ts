import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { queryClient } from '../../../../constants/query-client'
import { RECENTLY_PLAYED_ALBUM_THRESHOLD } from '../../../../configs/categorizing/home.config'
import { PlayItAgainQuery } from '..'
import { ArtistQueryKey } from '../../artist/keys'
import { setQueryUserDataForItem } from '../../user-data'
import { mapTracksToArtists } from '../../../../utils/mapping/track-to-artist'
import { captureError, LoggingContext } from '../../../../utils/logging'

export async function fetchRecentlyAdded(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getUserLibraryApi(api)
			.getLatestMedia(
				{
					parentId: library.musicLibraryId,
					limit: ApiLimits.Discover,
					enableUserData: true,
					fields: [ItemFields.ParentId, ItemFields.Tags],
				},
				{
					signal,
				},
			)
			.then(({ data }) => {
				if (data) {
					return resolve(data)
				}
				return resolve([])
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}

/**
 * Fetches recently played tracks for a user from the Jellyfin server.
 * Flattens albums if there are 3 or more tracks played from them.
 * @param limit The number of items to fetch. Defaults to 50
 * @param offset The offset of the items to fetch.
 * @returns The recently played items (with albums flattened).
 */
export async function fetchRecentlyPlayed(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	signal?: AbortSignal,
	limit: number = ApiLimits.Recents,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getItemsApi(api)
			.getItems(
				{
					includeItemTypes: [BaseItemKind.Audio],
					startIndex: page * limit,
					userId: user.id,
					limit,
					parentId: library.musicLibraryId,
					recursive: true,
					sortBy: [ItemSortBy.DatePlayed, ItemSortBy.SortName],
					sortOrder: [SortOrder.Descending],
					fields: [ItemFields.ParentId, ItemFields.Tags],
					enableUserData: true,
				},
				{ signal },
			)
			.then((response) => {
				if (!response.data.Items) return resolve([])

				const tracks = response.data.Items
				const result: BaseItemDto[] = []
				const tracksByAlbum = new Map<string, { track: BaseItemDto; index: number }[]>()

				// Group tracks by album
				tracks.forEach((track, index) => {
					const albumId = track.ParentId
					if (albumId) {
						if (!tracksByAlbum.has(albumId)) {
							tracksByAlbum.set(albumId, [])
						}
						tracksByAlbum.get(albumId)!.push({ track, index })
					}
				})

				// Process items: replace tracks with albums if count >= 3
				const processedIndexes = new Set<number>()

				tracks.forEach((track, index) => {
					if (processedIndexes.has(index)) return

					setQueryUserDataForItem(track)

					const albumId = track.ParentId
					if (albumId && tracksByAlbum.has(albumId)) {
						const albumTracks = tracksByAlbum.get(albumId)!
						if (albumTracks.length >= RECENTLY_PLAYED_ALBUM_THRESHOLD) {
							result.push({
								...track,
								Type: BaseItemKind.MusicAlbum,
								Name: track.Album,
								Id: albumId,
							})
							// Mark all tracks from this album as processed
							albumTracks.forEach(({ index: trackIndex }) => {
								processedIndexes.add(trackIndex)
							})
							return
						}
					}

					// Keep individual track if not part of a 3+ track album
					result.push(track)
				})

				return resolve(result)
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}

/**
 * Fetches recently played artists for a user, using the recently played tracks
 * from the query client since Jellyfin doesn't track when artists are played accurately.
 * @param page The page number of the recently played tracks to fetch artists from.
 * @returns The recently played artists.
 */
export async function fetchRecentlyPlayedArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) return Promise.reject('Client instance not set')
	if (isUndefined(user)) return Promise.reject('User instance not set')
	if (isUndefined(library)) return Promise.reject('Library instance not set')

	try {
		const recentTracks = await queryClient.infiniteQuery({
			...PlayItAgainQuery(library, signal),
			initialPageParam: page,
			staleTime: 'static',
		})

		return await mapTracksToArtists(recentTracks)
	} catch (error) {
		captureError(error, LoggingContext.Artists, 'Failed to fetch recently played artists')
		return Promise.reject(error)
	}
}
