import { useEffect, useState } from 'react'
import { DownloadManager, useDownloadProgress } from 'react-native-nitro-player'
import useDownloadQueueStore from '../../stores/download-queue'
import { DownloadGroup, groupDownloads } from '../../utils/download-groups'

/** The albums that are downloading, each with how far along it is */
export function useDownloadingAlbums(): DownloadGroup[] {
	const entries = useDownloadQueueStore((state) => state.entries)

	// Progress events are only a trigger to look again: a finished download's last event can go
	// missing, so what is running is read from the downloader's own list of tasks.
	const { progressMap } = useDownloadProgress({ activeOnly: true })

	const [running, setRunning] = useState<ReadonlyMap<string, number>>(new Map())

	useEffect(() => {
		setRunning(
			new Map(
				DownloadManager.getActiveDownloads()
					.filter((task) => task.state === 'pending' || task.state === 'downloading')
					.map((task) => [task.trackId, task.progress?.progress ?? 0]),
			),
		)
	}, [progressMap, entries])

	const { groups, forget } = groupDownloads(Object.values(entries), running, Date.now())

	// albums that have finished, and entries that never got going, are not needed any more
	useEffect(() => {
		if (forget.length > 0) useDownloadQueueStore.getState().remove(forget)
	}, [forget.join(',')])

	return groups
}
