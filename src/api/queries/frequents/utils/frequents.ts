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
import { fetchItem } from '../../item'
import { ApiLimits } from '../../../../configs/query.config'
import { JellifyUser } from '@/src/types/JellifyUser'
import { queryClient } from '../../../../constants/query-client'
import { InfiniteData } from '@tanstack/react-query'
import { FrequentlyPlayedTracksQueryKey } from '../keys'

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

		const frequentlyPlayed = queryClient.getQueryData<InfiniteData<BaseItemDto[]>>(
			FrequentlyPlayedTracksQueryKey(user, library),
		)
		if (isUndefined(frequentlyPlayed)) {
			return reject('Frequently played tracks not found in query client')
		}

		const artistIdWithPlayCount = frequentlyPlayed.pages[page]
			.filter(
				(track) =>
					!isUndefined(track.AlbumArtists) &&
					!isNull(track.AlbumArtists) &&
					!isEmpty(track.AlbumArtists) &&
					!isUndefined(track.AlbumArtists![0].Id),
			)
			.map(({ AlbumArtists, UserData }) => {
				return {
					artistId: AlbumArtists![0].Id!,
					playCount: UserData?.PlayCount ?? 0,
				}
			})

		console.info('Artist IDs with play count:', artistIdWithPlayCount.length)

		const artistPromises = artistIdWithPlayCount
			.reduce(
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
			.sort((a, b) => b.playCount - a.playCount)
			.map((artist) => {
				return fetchItem(api, artist.artistId)
			})

		return Promise.all(artistPromises)
			.then((artists) => {
				return resolve(artists.filter((artist) => !isUndefined(artist)))
			})
			.catch((error) => {
				reject(error)
			})
	})
}
