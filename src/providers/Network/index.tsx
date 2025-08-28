import React, { createContext, ReactNode, useContext, useEffect, useState, useMemo } from 'react'
import { JellifyDownloadProgress } from '../../types/JellifyDownload'
import { UseMutateFunction, useMutation } from '@tanstack/react-query'
import { saveAudio } from '../../api/mutations/download/offlineModeUtils'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import JellifyTrack from '../../types/JellifyTrack'
import { useAllDownloadedTracks } from '../../api/queries/download'

interface NetworkContext {
	useDownloadMultiple: UseMutateFunction<boolean, Error, JellifyTrack[], unknown>
	activeDownloads: JellifyDownloadProgress | undefined
	networkStatus: networkStatusTypes | null
	setNetworkStatus: (status: networkStatusTypes | null) => void
	pendingDownloads: JellifyTrack[]
	downloadingDownloads: JellifyTrack[]
	completedDownloads: JellifyTrack[]
	failedDownloads: JellifyTrack[]
}

const MAX_CONCURRENT_DOWNLOADS = 1
const NetworkContextInitializer = () => {
	const [downloadProgress, setDownloadProgress] = useState<JellifyDownloadProgress>({})
	const [networkStatus, setNetworkStatus] = useState<networkStatusTypes | null>(null)

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

	const addToQueue = async (items: JellifyTrack[]) => {
		setPending((prev) => [...prev, ...items])
		return true
	}

	const { mutate: useDownloadMultiple } = useMutation({
		mutationFn: (tracks: JellifyTrack[]) => {
			return addToQueue(tracks)
		},
		onSuccess: (data, variables) => {
			console.debug(`Added ${variables?.length} tracks to queue`)
		},
	})

	return {
		activeDownloads: downloadProgress,
		downloadedTracks,
		networkStatus,
		setNetworkStatus,
		useDownloadMultiple,
		pendingDownloads: pending,
		downloadingDownloads: downloading,
		completedDownloads: completed,
		failedDownloads: failed,
	}
}

const NetworkContext = createContext<NetworkContext>({
	activeDownloads: {},
	networkStatus: networkStatusTypes.ONLINE,
	setNetworkStatus: () => {},
	useDownloadMultiple: () => {},
	pendingDownloads: [],
	downloadingDownloads: [],
	completedDownloads: [],
	failedDownloads: [],
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
			context.networkStatus,
			context.pendingDownloads.length,
			context.downloadingDownloads.length,
			context.completedDownloads.length,
			context.failedDownloads.length,
			// Don't include mutation objects as they're stable
		],
	)

	return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export const useNetworkContext = () => useContext(NetworkContext)
