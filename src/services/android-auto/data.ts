import {
	BaseItemDto,
	BaseItemKind,
	ItemSortBy,
	SortOrder,
} from '@jellyfin/sdk/lib/generated-client/models'
import { fetchItems } from '../../api/queries/item'
import { InfiniteData } from '@tanstack/react-query'
import { chunk } from 'lodash'
import { DownloadedTrack } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import { PlayItAgainQuery } from '../../api/queries/recents'
import { RecentlyAddedQuery } from '../../api/queries/album/queries'
import { FrequentlyPlayedTracksQuery } from '../../api/queries/frequents/queries'
import { PlaylistTracksQuery, UserPlaylistsQuery } from '../../api/queries/playlist/queries'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import { captureError, captureInfo, captureWarning, LoggingContext } from '../../utils/logging'

export type Loaded<T> = { data: T; error: boolean }

export type PlaylistWithTracks = { playlist: BaseItemDto; tracks: BaseItemDto[] }

/** How many playlist track requests run at once when building the Playlists tab. */
const PLAYLIST_FETCH_CONCURRENCY = 5

const flatten = (data: InfiniteData<BaseItemDto[]> | undefined): BaseItemDto[] =>
	data?.pages.flatMap((page) => page) ?? []

async function load<T>(label: string, fallback: T, run: () => Promise<T>): Promise<Loaded<T>> {
	const startedAt = Date.now()
	try {
		const data = await run()
		captureInfo(LoggingContext.AndroidAuto, `${label} loaded in ${Date.now() - startedAt}ms`)
		return { data, error: false }
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, `${label} failed to load`)
		return { data: fallback, error: true }
	}
}

export const loadRecentlyPlayed = () =>
	load('Recently played', [] as BaseItemDto[], async () =>
		flatten(await queryClient.ensureInfiniteQueryData(PlayItAgainQuery(getLibrary()))),
	)

export const loadFrequentlyPlayed = () =>
	load('Frequently played', [] as BaseItemDto[], async () =>
		flatten(
			await queryClient.ensureInfiniteQueryData(
				FrequentlyPlayedTracksQuery(getUser(), getLibrary(), getApi()),
			),
		),
	)

/** Most favourite tracks in the Favourites playlist. */
export const FAVORITES_TRACK_CAP = 200

export const loadFavorites = () =>
	load('Favourites', [] as BaseItemDto[], async () => {
		const { data } = await fetchItems(
			getApi(),
			getUser(),
			getLibrary(),
			[BaseItemKind.Audio],
			0,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			true,
		)
		return data.slice(0, FAVORITES_TRACK_CAP)
	})

export const loadRecentlyAdded = () =>
	load('Recently added', [] as BaseItemDto[], async () =>
		flatten(await queryClient.ensureInfiniteQueryData(RecentlyAddedQuery())),
	)

// ponytail: nitro-player's Android Auto tree is static, so every playlist's tracks are
// materialized up front. These caps bound that work; past them, playlists are left out.
// Upgrade path: lazy children in nitro-player (plan Appendix A) instead of bigger caps.
/** Most tracks materialized for one playlist. */
export const PLAYLIST_TRACK_CAP = 200
/** Most tracks materialized for the whole Playlists tab. */
export const PLAYLISTS_TRACK_BUDGET = 5000

/** A playlist's first page of tracks, or `null` (logged) when it fails to load. */
async function loadPlaylistTracks(playlist: BaseItemDto): Promise<BaseItemDto[] | null> {
	try {
		return flatten(await queryClient.ensureInfiniteQueryData(PlaylistTracksQuery(playlist)))
	} catch (error) {
		captureWarning(
			LoggingContext.AndroidAuto,
			`Skipping playlist ${playlist.Id}: tracks failed to load`,
			error,
		)
		return null
	}
}

/**
 * User playlists with up to {@link PLAYLIST_TRACK_CAP} tracks each, until
 * {@link PLAYLISTS_TRACK_BUDGET} tracks are loaded. Only a failure to list the
 * playlists is an error; a playlist whose tracks fail to load is skipped.
 */
export const loadUserPlaylists = () =>
	load('User playlists', [] as PlaylistWithTracks[], async () => {
		const playlists = flatten(await queryClient.ensureInfiniteQueryData(UserPlaylistsQuery()))
		const result: PlaylistWithTracks[] = []
		let budget = PLAYLISTS_TRACK_BUDGET
		let failed = 0

		for (const batch of chunk(playlists, PLAYLIST_FETCH_CONCURRENCY)) {
			if (budget <= 0) break

			const loaded = await Promise.all(batch.map(loadPlaylistTracks))

			loaded.forEach((tracks, i) => {
				if (!tracks) failed++
				else if (budget > 0) {
					const kept = tracks.slice(0, Math.min(PLAYLIST_TRACK_CAP, budget))
					budget -= kept.length
					result.push({ playlist: batch[i], tracks: kept })
				}
			})
		}

		const omitted = playlists.length - result.length - failed
		if (omitted > 0)
			captureWarning(
				LoggingContext.AndroidAuto,
				`Track budget of ${PLAYLISTS_TRACK_BUDGET} reached: ${omitted} playlists left out`,
			)

		return result
	})

export const loadDownloads = () =>
	load('Downloads', [] as DownloadedTrack[], ensureDownloadedTracks)
