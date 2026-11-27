import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { DownloadManager, useDownloadProgress } from 'react-native-nitro-player'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { handleError } from '../../utils/errors'
import { LoggingContext } from '../../utils/logging'
import { useDownloadedIds } from '.'
import { downloadItems } from './functions'
import { cancelDownloadsOf, isActiveDownload } from './functions/cancel'
import { useDeleteDownloads } from './mutations'

export type CollectionDownloadState = 'loading' | 'empty' | 'ready' | 'downloading' | 'downloaded'

/**
 * Downloading a set of tracks that belong together, such as an album or a playlist: what state
 * they are in, how far along, and starting, stopping and removing them.
 *
 * @param tracks The tracks, once they are known
 */
export function useCollectionDownload(tracks: BaseItemDto[] | undefined) {
	const trackIds = tracks?.map((track) => track.Id!) ?? []

	const downloadedIds = useDownloadedIds()

	const missingTracks = tracks?.filter((track) => !downloadedIds?.has(track.Id!)) ?? []

	// Progress events are only a trigger to look again: a finished download's last event can go
	// missing, which leaves it looking busy for good. The downloader's own list of tasks is what's true.
	const { progressMap } = useDownloadProgress({ trackIds, activeOnly: true })

	const [running, setRunning] = useState<Map<string, number>>(new Map())

	/** What the downloader is running or has waiting of these tracks, and how far along each is */
	const readRunning = () => {
		const ours = new Set(trackIds)

		return new Map(
			DownloadManager.getActiveDownloads()
				.filter((task) => ours.has(task.trackId) && isActiveDownload(task))
				.map((task): [string, number] => [
					task.trackId,
					progressMap.get(task.trackId)?.progress ?? 0,
				]),
		)
	}

	useEffect(() => {
		setRunning(readRunning())
	}, [progressMap, tracks])

	/** For the tracks being handed over, so that stopping can stop that too */
	const handingOver = useRef<AbortController | null>(null)

	const download = useMutation({
		mutationFn: async (items: BaseItemDto[]) => {
			const controller = new AbortController()
			handingOver.current = controller

			try {
				await downloadItems(items, controller.signal)
			} finally {
				if (handingOver.current === controller) handingOver.current = null
			}
		},
		onError: (error) => handleError(error, LoggingContext.Downloads, 'download'),
	})

	const { mutate: removeDownloads } = useDeleteDownloads()

	// The downloader keeps reporting a download in progress for a while after its last track has
	// landed, so having everything is what decides, not how busy it says it is
	const state: CollectionDownloadState = !tracks
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

	return {
		state,
		progress,
		download: () => download.mutate(missingTracks),
		/** Stops what is downloading, and what is being handed over to download */
		cancel: async () => {
			handingOver.current?.abort()

			await cancelDownloadsOf(new Set(trackIds))

			// a task that was only waiting may never say it is gone, so look rather than wait to be told
			setRunning(readRunning())
		},
		remove: () => removeDownloads(trackIds),
	}
}

export type CollectionDownload = ReturnType<typeof useCollectionDownload>
