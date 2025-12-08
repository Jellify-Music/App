import {
	BaseItemDto,
	BaseItemKind,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api'
import QueryConfig, { ApiLimits } from '../../../../configs/query.config'
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { queryClient } from '../../../../constants/query-client'
import { QueryKeys } from '../../../../enums/query-keys'
import { InfiniteData } from '@tanstack/react-query'
import { fetchItems } from '../../item'
import { RecentlyPlayedTracksQueryKey } from '../keys'

export async function fetchRecentlyAdded(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getUserLibraryApi(api)
			.getLatestMedia({
				parentId: library.musicLibraryId,
				limit: ApiLimits.Discover,
			})
			.then(({ data }) => {
				if (data) return resolve(data)
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
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getItemsApi(api)
			.getItems({
				includeItemTypes: [BaseItemKind.Audio],
				startIndex: page * limit,
				userId: user.id,
				limit,
				parentId: library.musicLibraryId,
				recursive: true,
				sortBy: [ItemSortBy.DatePlayed],
				sortOrder: [SortOrder.Descending],
				fields: [ItemFields.ParentId],
				enableUserData: true,
			})
			.then((response) => {
				if (response.data.Items) return resolve(response.data.Items)
				return resolve([])
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
export function fetchRecentlyPlayedArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
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
