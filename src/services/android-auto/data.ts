import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { InfiniteData } from '@tanstack/react-query'
import { chunk } from 'lodash'
import { DownloadedTrack } from 'react-native-nitro-player'
import { queryClient } from '../../constants/query-client'
import { PlayItAgainQuery } from '../../api/queries/recents'
import { FrequentlyPlayedTracksQuery } from '../../api/queries/frequents/queries'
import { PlaylistTracksQuery, UserPlaylistsQuery } from '../../api/queries/playlist/queries'
import { ensureDownloadedTracks } from '../../hooks/downloads/utils'
import { getApi, getLibrary, getUser } from '../../stores/auth/utils'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'

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

/** Every user playlist with its first page (400) of tracks. */
export const loadUserPlaylists = () =>
	load('User playlists', [] as PlaylistWithTracks[], async () => {
		const playlists = flatten(await queryClient.ensureInfiniteQueryData(UserPlaylistsQuery()))
		const result: PlaylistWithTracks[] = []

		for (const batch of chunk(playlists, PLAYLIST_FETCH_CONCURRENCY)) {
			result.push(
				...(await Promise.all(
					batch.map(async (playlist) => ({
						playlist,
						tracks: flatten(
							await queryClient.ensureInfiniteQueryData(
								PlaylistTracksQuery(playlist),
							),
						),
					})),
				)),
			)
		}

		return result
	})

export const loadDownloads = () =>
	load('Downloads', [] as DownloadedTrack[], ensureDownloadedTracks)
