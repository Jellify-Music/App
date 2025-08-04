import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { isUndefined } from 'lodash'
import { JellifyLibrary } from '../../types/JellifyLibrary'
import { fetchItem } from './item'

/**
 * Fetches the 100 most frequently played items from the user's library
 * @param api The Jellyfin {@link Api} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @param page The page number to fetch
 * @returns The most frequently played items from the user's library
 */
export function fetchFrequentlyPlayed(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		getItemsApi(api!)
			.getItems({
				includeItemTypes: [BaseItemKind.Audio],
				parentId: library!.musicLibraryId,
				recursive: true,
				limit: 100,
				startIndex: page * 100,
				sortBy: [ItemSortBy.PlayCount],
				sortOrder: [SortOrder.Descending],
			})
			.then(({ data }) => {
				if (data.Items) resolve(data.Items)
				else resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}

/**
 * Fetches most frequently played artists from the user's library based on the
 * {@link fetchFrequentlyPlayed} query
 * @param api The Jellyfin {@link Api} instance
 * @param library The Jellyfin {@link JellifyLibrary} instance
 * @param page The page number to fetch
 * @returns The most frequently played artists from the user's library
 */
export function fetchFrequentlyPlayedArtists(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	console.debug('Fetching frequently played artists', page)

	return new Promise((resolve, reject) => {
		console.debug('Fetching frequently played artists')

		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		fetchFrequentlyPlayed(api, library, 0)
			.then((frequentTracks) => {
				return frequentTracks
					.filter((track) => !isUndefined(track.AlbumArtists))
					.map((track) => {
						return {
							artistId: track.AlbumArtists![0].Id!,
							playCount: track.UserData?.PlayCount ?? 0,
						}
					})
			})
			.then((albumArtistsWithPlayCounts) => {
				return albumArtistsWithPlayCounts.reduce(
					(acc, { artistId, playCount }) => {
						const existing = acc.find((a) => a.artistId === artistId)
						if (existing) {
							existing.playCount += playCount
						} else {
							acc.push({ artistId, playCount })
						}
						return acc
					},
					[] as { artistId: string; playCount: number }[],
				)
			})
			.then((artistsWithPlayCounts) => {
				console.debug('Fetching artists')
				const artists = artistsWithPlayCounts
					.sort((a, b) => b.playCount - a.playCount)
					.map((artist) => {
						return fetchItem(api, artist.artistId)
					})

				return Promise.all(artists)
			})
			.then((artists) => {
				return resolve(artists.filter((artist) => !isUndefined(artist)))
			})
			.catch((error) => {
				reject(error)
			})
	})
}
