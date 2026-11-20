import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DownloadManager, useDownloadProgress } from 'react-native-nitro-player'
import { useTranslation } from 'react-i18next'
import { useArtistContext } from '../../providers/Artist'
import { fetchAlbumsTracks } from '../../api/queries/artist/utils/download-tracks'
import { getApi } from '../../stores/auth/utils'
import { QueryAges } from '../../constants/durations'
import { chunk } from '../../utils/concurrency'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'
import { useDownloadedIds } from '.'
import { downloadItems } from './functions'
import { useDeleteDownloads } from './mutations'

/** Past this many tracks, downloading or removing asks first: it is a lot of storage, or of undoing */
export const ARTIST_DOWNLOAD_CONFIRM_THRESHOLD = 100

/**
 * How many tracks to hand to the downloader at once. Each one needs its playback info first, and
 * asking for hundreds at the same moment would stall the app's HTTP layer.
 */
const DOWNLOAD_BATCH_SIZE = 25

export type ArtistDownloadState = 'loading' | 'empty' | 'ready' | 'downloading' | 'downloaded'

/**
 * Downloading everything by the artist on the page: every track on their discography and on the
 * albums they're featured on.
 */
export function useArtistDownload() {
	const { t } = useTranslation()

	const { artist, albums, featuredOn } = useArtistContext()

	const albumsToDownload = albums && featuredOn ? [...albums, ...featuredOn] : undefined

	const { data: tracks } = useQuery({
		queryKey: [
			'ARTIST_DOWNLOAD_TRACKS',
			artist.Id,
			albumsToDownload?.map((album) => album.Id).join(','),
		],
		queryFn: ({ signal }) => fetchAlbumsTracks(getApi(), albumsToDownload!, signal),
		enabled: Boolean(artist.Id) && albumsToDownload !== undefined,
		staleTime: QueryAges.OneHour,
		gcTime: QueryAges.OneHour,
	})

	const trackIds = tracks?.map((track) => track.Id!) ?? []

	const downloadedIds = useDownloadedIds()

	const missingTracks = tracks?.filter((track) => !downloadedIds?.has(track.Id!)) ?? []

	// Progress events are only a trigger to look again: a finished download's last event can go
	// missing, which leaves it looking busy for good. The downloader's own list of tasks is what's true.
	const { progressMap } = useDownloadProgress({ trackIds, activeOnly: true })

	const [running, setRunning] = useState<Map<string, number>>(new Map())

	useEffect(() => {
		const ours = new Set(trackIds)

		setRunning(
			new Map(
				DownloadManager.getActiveDownloads()
					.filter(
						(task) =>
							ours.has(task.trackId) &&
							(task.state === 'pending' || task.state === 'downloading'),
					)
					.map((task) => [task.trackId, progressMap.get(task.trackId)?.progress ?? 0]),
			),
		)
	}, [progressMap, tracks])

	const download = useMutation({
		mutationFn: async (items: typeof missingTracks) => {
			for (const batch of chunk(items, DOWNLOAD_BATCH_SIZE)) await downloadItems(batch)
		},
		onError: (error) => handleError(error, LoggingContext.Downloads, 'download'),
	})

	const { mutate: removeDownloads } = useDeleteDownloads()

	// The downloader keeps reporting a download in progress for a while after its last track has
	// landed, so having everything is what decides, not how busy it says it is
	const state: ArtistDownloadState = !tracks
		? 'loading'
		: tracks.length === 0
			? 'empty'
			: missingTracks.length === 0
				? 'downloaded'
				: download.isPending || running.size > 0
					? 'downloading'
					: 'ready'

	// the tracks that are done, and how far along the ones being downloaded are
	const total = tracks?.length ?? 0
	const inFlight = [...running.values()].reduce((sum, progress) => sum + progress, 0)
	const progress = total === 0 ? 0 : (total - missingTracks.length + inFlight) / total

	/** Asks first when it is a lot of tracks, then does it */
	const confirmThen = (
		count: number,
		title: string,
		message: string,
		confirmLabel: string,
		action: () => void,
	) => {
		if (count <= ARTIST_DOWNLOAD_CONFIRM_THRESHOLD) return action()

		Alert.alert(title, message, [
			{ text: t('common.cancel'), style: 'cancel' },
			{ text: confirmLabel, onPress: action },
		])
	}

	const name = artist.Name ?? t('placeholders.unknownArtist')

	const startDownload = () =>
		confirmThen(
			missingTracks.length,
			t('artist.download.confirmTitle', { count: missingTracks.length }),
			t('artist.download.confirmMessage', { name, count: missingTracks.length }),
			t('context.download'),
			() => download.mutate(missingTracks),
		)

	const removeAll = () =>
		confirmThen(
			trackIds.length,
			t('artist.download.removeTitle', { count: trackIds.length }),
			t('artist.download.removeMessage', { name, count: trackIds.length }),
			t('context.removeDownload'),
			() => removeDownloads(trackIds),
		)

	return { state, progress, startDownload, removeAll }
}
