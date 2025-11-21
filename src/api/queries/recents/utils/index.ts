import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import QueryConfig, { ApiLimits } from '../../../../configs/query.config'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { queryClient } from '../../../../constants/query-client'
import { QueryKeys } from '../../../../enums/query-keys'
import { InfiniteData } from '@tanstack/react-query'
import { fetchItems } from '../../item'
import { RecentlyPlayedTracksQueryKey } from '../keys'
import { nitroFetch } from '../../../utils/nitro'

export async function fetchRecentlyAdded(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<BaseItemDto[]>(api, `/Users/Me/Items/Latest`, {
			ParentId: library.musicLibraryId,
			Limit: ApiLimits.Discover,
		})
		return response || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Fetches recently played tracks for a user from the Jellyfin server.
 * @param limit The number of items to fetch. Defaults to 50
 * @param offset The offset of the items to fetch.
 * @returns The recently played items.
 */
export async function fetchRecentlyPlayed(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	limit: number = ApiLimits.Home,
): Promise<BaseItemDto[]> {
	console.debug('Fetching recently played items')

	if (isUndefined(api)) throw new Error('Client instance not set')
	if (isUndefined(user)) throw new Error('User instance not set')
	if (isUndefined(library)) throw new Error('Library instance not set')

	try {
		const response = await nitroFetch<{ Items: BaseItemDto[] }>(api, '/Items', {
			IncludeItemTypes: [BaseItemKind.Audio],
			StartIndex: page * limit,
			UserId: user.id,
			Limit: limit,
			ParentId: library.musicLibraryId,
			Recursive: true,
			SortBy: [ItemSortBy.DatePlayed],
			SortOrder: [SortOrder.Descending],
			Fields: [ItemFields.ParentId],
			EnableUserData: true,
		})
		return response.Items || []
	} catch (error) {
		console.error(error)
		throw error
	}
}

/**
 * Fetches recently played artists for a user, using the recently played tracks
 * from the query client since Jellyfin doesn't track when artists are played accurately.
 * @param page The page number of the recently played tracks to fetch artists from.
 * @returns The recently played artists.
 */
export function fetchRecentlyPlayedArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	console.debug('Fetching recently played artists')
	return new Promise((resolve, reject) => {
		if (isUndefined(library)) return reject('Library instance not set')

		// Get the recently played tracks from the query client
		const recentlyPlayedTracks = queryClient.getQueryData<InfiniteData<BaseItemDto[]>>(
			RecentlyPlayedTracksQueryKey(user, library),
		)
		if (!recentlyPlayedTracks) {
			return resolve([])
		}

		// Get the artists from the recently played tracks
		const artists = recentlyPlayedTracks.pages[page]

			// Map artist from the recently played tracks
			.map((track) => (track.ArtistItems ? track.ArtistItems[0] : undefined))

			// Filter out undefined artists
			.filter((artist) => artist !== undefined)

			// Filter out duplicate artists
			.filter(
				(artist, index, artists) =>
					artists.findIndex((duplicateArtist) => duplicateArtist.Id === artist.Id) ===
					index,
			)

		fetchItems(
			api,
			user,
			library,
			[BaseItemKind.MusicArtist],
			page,
			undefined,
			undefined,
			undefined,
			undefined,
			artists.map((artist) => artist.Id!),
		)
			.then((artistPages) => {
				resolve(
					artistPages.data.sort((a, b) => {
						const aIndex = artists.findIndex((artist) => artist.Id === a.Id)
						const bIndex = artists.findIndex((artist) => artist.Id === b.Id)
						return aIndex - bIndex
					}),
				)
			})
			.catch((error) => {
				console.error(error)
				return reject(error)
			})
	})
}
