import {
	BaseItemDto,
	BaseItemKind,
	ImageType,
	ItemFields,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { ApiLimits } from '../../../../configs/querying/index.config'
import { Api } from '@jellyfin/sdk'
import { isUndefined, orderBy } from 'lodash'
import { JellifyLibrary } from '../../../../types/JellifyLibrary'
import { JellifyUser } from '../../../../types/JellifyUser'
import { queryClient } from '../../../client'
import { RECENTLY_PLAYED_ALBUM_THRESHOLD } from '../../../../configs/categorizing/home.config'
import { PlayItAgainQuery } from '..'
import { ArtistQueryKey } from '../../artist/keys'
import { setQueryUserDataForItem } from '../../user-data/cache'
import { fetchMusicLibraryIds } from '../../libraries/utils/music-libraries'

/**
 * Fetches the albums most recently added to the user's music.
 *
 * The latest media endpoint needs a library to look in, so when no library is selected
 * each music library is queried and the newest albums across all of them are kept.
 *
 * @param api The Jellyfin {@link Api} instance
 * @param library The selected {@link JellifyLibrary}, or `undefined` for all music libraries
 * @param page The page to fetch. The latest media endpoint isn't paginated, so this is unused
 * @param signal Optional AbortSignal to cancel the request
 * @returns The most recently added albums, newest first
 */
export async function fetchRecentlyAdded(
	api: Api | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	if (isUndefined(api)) throw new Error('Client instance not set')

	try {
		const libraryIds = await fetchMusicLibraryIds(library)

		const latest = await Promise.all(
			libraryIds.map((parentId) =>
				getLibraryApi(api)
					.getLatestMedia(
						{
							parentId,
							limit: ApiLimits.Discover,
							enableUserData: true,
							includeItemTypes: [BaseItemKind.MusicAlbum],
							fields: [ItemFields.ParentId, ItemFields.Tags, ItemFields.DateCreated],
						},
						{
							signal,
						},
					)
					.then(({ data }) => data ?? []),
			),
		)

		if (latest.length === 1) return latest[0]

		return orderBy(latest.flat(), ({ DateCreated }) => DateCreated ?? '', 'desc').slice(
			0,
			ApiLimits.Discover,
		)
	} catch (error) {
		console.error(error)
		throw error
	}
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

		getLibraryApi(api)
			.getItems(
				{
					includeItemTypes: [BaseItemKind.Audio],
					startIndex: page * limit,
					userId: user.id,
					limit,
					parentId: library?.musicLibraryId,
					recursive: true,
					sortBy: [ItemSortBy.DatePlayed],
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
export function fetchRecentlyPlayedArtists(
	api: Api | undefined,
	user: JellifyUser | undefined,
	library: JellifyLibrary | undefined,
	page: number,
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	return new Promise((resolve, reject) => {
		if (isUndefined(api)) return reject('Client instance not set')
		if (isUndefined(user)) return reject('User instance not set')

		// Get the recently played tracks from the query client
		queryClient
			.infiniteQuery({
				...PlayItAgainQuery(library),
				staleTime: 'static',
				// Keep the pages, since artists are derived from one page at a time
				select: (data) => data,
			})
			.then((recentlyPlayedTracks) => {
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
							artists.findIndex(
								(duplicateArtist) => duplicateArtist.Id === artist.Id,
							) === index,
					)

				const artistIds = artists.map((artist) => artist.Id!).filter(Boolean)

				if (artistIds.length === 0) {
					return resolve([])
				}

				getLibraryApi(api)
					.getItems(
						{
							userId: user.id,
							includeItemTypes: [BaseItemKind.MusicArtist],
							ids: artistIds,
							fields: [ItemFields.Genres, ItemFields.SortName, ItemFields.Tags],
							enableImages: true,
							enableImageTypes: [ImageType.Backdrop, ImageType.Primary],
							imageTypeLimit: 1,
							enableUserData: true,
						},
						{ signal },
					)
					.then(({ data }) => {
						const fetchedArtists = data.Items ?? []

						fetchedArtists.forEach((artist) => {
							setQueryUserDataForItem(artist)
							queryClient.setQueryData(ArtistQueryKey(artist.Id), artist)
						})

						resolve(
							fetchedArtists.sort((a, b) => {
								const aIndex = artists.findIndex((artist) => artist.Id === a.Id)
								const bIndex = artists.findIndex((artist) => artist.Id === b.Id)
								return aIndex - bIndex
							}),
						)
					})
					.catch(reject)
			})
			.catch(reject)
	})
}
