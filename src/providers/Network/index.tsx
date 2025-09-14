import React, { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react'
import { JellifyDownloadProgress } from '../../types/JellifyDownload'
import { saveAudio } from '../../api/mutations/download/offlineModeUtils'
import JellifyTrack from '../../types/JellifyTrack'
import { useAllDownloadedTracks } from '../../api/queries/download'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'

interface NetworkContext {
	activeDownloads: JellifyDownloadProgress | undefined
	pendingDownloads: JellifyTrack[]
	downloadingDownloads: JellifyTrack[]
	completedDownloads: JellifyTrack[]
	failedDownloads: JellifyTrack[]
	addToDownloadQueue: (items: JellifyTrack[]) => boolean
}

const MAX_CONCURRENT_DOWNLOADS = 1

const COMPONENT_NAME = 'NetworkProvider'

const NetworkContextInitializer = () => {
	usePerformanceMonitor(COMPONENT_NAME, 5)
	const [downloadProgress, setDownloadProgress] = useState<JellifyDownloadProgress>({})

	// Mutiple Downloads
	const [pending, setPending] = useState<JellifyTrack[]>([])
	const [downloading, setDownloading] = useState<JellifyTrack[]>([])
	const [completed, setCompleted] = useState<JellifyTrack[]>([])
	const [failed, setFailed] = useState<JellifyTrack[]>([])

	const { data: downloadedTracks, refetch: refetchDownloadedTracks } = useAllDownloadedTracks()

	useEffect(() => {
		if (pending.length > 0 && downloading.length < MAX_CONCURRENT_DOWNLOADS) {
			const availableSlots = MAX_CONCURRENT_DOWNLOADS - downloading.length
			const filesToStart = pending.slice(0, availableSlots)

			filesToStart.forEach((file) => {
				setDownloading((prev) => [...prev, file])
				setPending((prev) => prev.filter((f) => f.item.Id !== file.item.Id))
				if (downloadedTracks?.some((t) => t.item.Id === file.item.Id)) {
					setDownloading((prev) => prev.filter((f) => f.item.Id !== file.item.Id))
					setCompleted((prev) => [...prev, file])
					return
				}

				saveAudio(file, setDownloadProgress, false).then((success) => {
					setDownloading((prev) => prev.filter((f) => f.item.Id !== file.item.Id))
					if (success) {
						setCompleted((prev) => [...prev, file])
					} else {
						setFailed((prev) => [...prev, file])
					}
				})
			})
		}
		if (pending.length === 0 && downloading.length === 0) {
			refetchDownloadedTracks()
		}
	}, [pending, downloading])

	const addToDownloadQueue = (items: JellifyTrack[]) => {
		setPending((prev) => [...prev, ...items])
		return true
	}

	return {
		activeDownloads: downloadProgress,
		downloadedTracks,
		pendingDownloads: pending,
		downloadingDownloads: downloading,
		completedDownloads: completed,
		failedDownloads: failed,
		addToDownloadQueue,
	}
}

const NetworkContext = createContext<NetworkContext>({
	activeDownloads: {},
	pendingDownloads: [],
	downloadingDownloads: [],
	completedDownloads: [],
	failedDownloads: [],
	addToDownloadQueue: () => true,
})

export const NetworkContextProvider: ({
	children,
}: {
	children: ReactNode
}) => React.JSX.Element = ({ children }: { children: ReactNode }) => {
	const context = NetworkContextInitializer()

	// Memoize the context value to prevent unnecessary re-renders
	const value = useMemo(
		() => context,
		[
			context.downloadedTracks?.length,
			context.pendingDownloads.length,
			context.downloadingDownloads.length,
			context.completedDownloads.length,
			context.failedDownloads.length,
		],
	)

	return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export const useNetworkContext = () => useContext(NetworkContext)
