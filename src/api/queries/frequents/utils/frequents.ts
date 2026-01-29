import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api'
import { Api } from '@jellyfin/sdk'
import { isEmpty, isNull, isUndefined } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { ApiLimits } from '../../../../configs/query.config'
import { JellifyUser } from '@/src/types/JellifyUser'
import { queryClient } from '../../../../constants/query-client'
import { QueryKey } from '@tanstack/react-query'
import { FrequentlyPlayedTracksQuery } from '../queries'

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
				limit: ApiLimits.Home,
				startIndex: page * ApiLimits.Home,
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
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(library)) return reject('Library instance not set')

		queryClient
			.ensureInfiniteQueryData<BaseItemDto[], Error, BaseItemDto[], QueryKey, number>(
				FrequentlyPlayedTracksQuery(user, library, api),
			)
			.then(async (frequentlyPlayed) => {
				const artistWithPlayCount = frequentlyPlayed.pages[page]
					.filter(
						(track) =>
							!isUndefined(track.AlbumArtists) &&
							!isNull(track.AlbumArtists) &&
							!isEmpty(track.AlbumArtists) &&
							!isUndefined(track.AlbumArtists![0].Id),
					)
					.map(({ AlbumArtists, UserData }) => {
						return {
							artist: AlbumArtists![0],
							playCount: UserData?.PlayCount ?? 0,
						}
					})

				const sortedArtists = artistWithPlayCount
					.reduce(
						(acc, { artist, playCount }) => {
							const existing = acc.find((a) => a.artist.Id === artist.Id)
							if (existing) {
								existing.playCount += playCount
							} else {
								acc.push({ artist, playCount })
							}
							return acc
						},
						[] as { artist: BaseItemDto; playCount: number }[],
					)
					.sort((a, b) => b.playCount - a.playCount)

				const uniqueArtistIds = sortedArtists
					.map(({ artist }) => artist.Id!)
					.filter((id) => !isUndefined(id))

				// Fetch full artist details to get ImageTags
				if (uniqueArtistIds.length > 0) {
					const { data } = await getItemsApi(api!).getItems({
						ids: uniqueArtistIds,
						includeItemTypes: [BaseItemKind.MusicArtist],
					})

					if (data.Items) {
						// Return artists in the same sorted order
						const artistMap = new Map(data.Items.map((a) => [a.Id, a]))
						return resolve(
							uniqueArtistIds
								.map((id) => artistMap.get(id))
								.filter((artist): artist is BaseItemDto => !isUndefined(artist)),
						)
					}
				}

				return resolve([])
			})
			.catch((error) => {
				reject(error)
			})
	})
}
