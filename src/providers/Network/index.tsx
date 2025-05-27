import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { JellifyDownload, JellifyDownloadProgress } from '../../types/JellifyDownload'
import {
	useMutation,
	UseMutationResult,
	useQuery,
	useQueryClient,
	UseQueryResult,
} from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { mapDtoToTrack } from '../../helpers/mappings'
import { deleteAudio, getAudioCache, saveAudio } from '../../components/Network/offlineModeUtils'
import { QueryKeys } from '../../enums/query-keys'
import { networkStatusTypes } from '../../components/Network/internetConnectionWatcher'
import DownloadProgress from '../../types/DownloadProgress'
import { useJellifyContext } from '..'
import { useSettingsContext } from '../Settings'
import { isUndefined } from 'lodash'
import RNFS from 'react-native-fs'
import { JellifyStorage } from './types'
import { JellifyTrack } from '@/src/types/JellifyTrack'

interface NetworkContext {
	useDownload: UseMutationResult<boolean | void, Error, BaseItemDto, unknown>
	useRemoveDownload: UseMutationResult<void, Error, BaseItemDto, unknown>
	storageUsage: JellifyStorage | undefined
	downloadedTracks: JellifyDownload[] | undefined
	activeDownloads: JellifyDownloadProgress | undefined
	networkStatus: networkStatusTypes | null
	setNetworkStatus: (status: networkStatusTypes | null) => void
	useDownloadMultiple: UseMutationResult<boolean, Error, JellifyTrack[], unknown>
	pendingDownloads: JellifyTrack[]
	downloadingDownloads: JellifyTrack[]
	completedDownloads: JellifyTrack[]
	failedDownloads: JellifyTrack[]
}

const MAX_CONCURRENT_DOWNLOADS = 1
const NetworkContextInitializer = () => {
	const { api, sessionId } = useJellifyContext()
	const { downloadQuality } = useSettingsContext()

	const [downloadProgress, setDownloadProgress] = useState<JellifyDownloadProgress>({})
	const [networkStatus, setNetworkStatus] = useState<networkStatusTypes | null>(null)

	// Mutiple Downloads
	const [pending, setPending] = useState<JellifyTrack[]>([])
	const [downloading, setDownloading] = useState<JellifyTrack[]>([])
	const [completed, setCompleted] = useState<JellifyTrack[]>([])
	const [failed, setFailed] = useState<JellifyTrack[]>([])

	const fetchStorageInUse: () => Promise<JellifyStorage> = async () => {
		const totalStorage = await RNFS.getFSInfo()
		const storageInUse = await RNFS.stat(RNFS.DocumentDirectoryPath)

		return {
			totalStorage: totalStorage.totalSpace,
			freeSpace: totalStorage.freeSpace,
			storageInUseByJellify: storageInUse.size,
		}
	}

	useEffect(() => {
		if (pending.length > 0 && downloading.length < MAX_CONCURRENT_DOWNLOADS) {
			const availableSlots = MAX_CONCURRENT_DOWNLOADS - downloading.length
			const filesToStart = pending.slice(0, availableSlots)

			filesToStart.forEach((file) => {
				setDownloading((prev) => [...prev, file])
				setPending((prev) => prev.filter((f) => f.item.Id !== file.item.Id))

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

	const useDownload = useMutation({
		mutationFn: (trackItem: BaseItemDto) => {
			if (isUndefined(api)) throw new Error('API client not initialized')

			const track = mapDtoToTrack(api, sessionId, trackItem, [], undefined, downloadQuality)

			return saveAudio(track, setDownloadProgress, false)
		},
		onSuccess: (data, variables) => {
			console.debug(`Downloaded ${variables.Id} successfully`)
			refetchDownloadedTracks()
			return data
		},
	})

	const { data: storageUsage } = useQuery({
		queryKey: [QueryKeys.StorageInUse],
		queryFn: () => fetchStorageInUse(),
		staleTime: 1000 * 60 * 60 * 1, // 1 hour
	})

	const useRemoveDownload = useMutation({
		mutationFn: (trackItem: BaseItemDto) => deleteAudio(trackItem),
		onSuccess: (data, { Id }) => {
			console.debug(`Removed ${Id} from storage`)

			refetchDownloadedTracks()
		},
	})

	const addToQueue = async (items: JellifyTrack[]) => {
		setPending((prev) => [...prev, ...items])
		return true
	}

	const useDownloadMultiple = useMutation({
		mutationFn: (tracks: JellifyTrack[]) => {
			return addToQueue(tracks)
		},
		onSuccess: (data, variables) => {
			console.debug(`Added ${variables?.length} tracks to queue`)
		},
	})

	const { data: downloadedTracks, refetch: refetchDownloadedTracks } = useQuery({
		queryKey: [QueryKeys.AudioCache],
		queryFn: getAudioCache,
		staleTime: 1000 * 60, // 1 minute
	})

	return {
		useDownload,
		useRemoveDownload,
		activeDownloads: downloadProgress,
		downloadedTracks,
		networkStatus,
		setNetworkStatus,
		storageUsage,
		useDownloadMultiple,
		pendingDownloads: pending,
		downloadingDownloads: downloading,
		completedDownloads: completed,
		failedDownloads: failed,
	}
}

const NetworkContext = createContext<NetworkContext>({
	useDownload: {
		mutate: () => {},
		mutateAsync: async () => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	useRemoveDownload: {
		mutate: () => {},
		mutateAsync: async () => {},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
	downloadedTracks: [],
	activeDownloads: {},
	networkStatus: networkStatusTypes.ONLINE,
	setNetworkStatus: () => {},
	storageUsage: undefined,
	useDownloadMultiple: {
		mutate: () => {},
		mutateAsync: async () => {
			return true
		},
		data: undefined,
		error: null,
		variables: undefined,
		isError: false,
		isIdle: true,
		isPaused: false,
		isPending: false,
		isSuccess: false,
		status: 'idle',
		reset: () => {},
		context: {},
		failureCount: 0,
		failureReason: null,
		submittedAt: 0,
	},
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

	return <NetworkContext.Provider value={context}>{children}</NetworkContext.Provider>
}

export const useNetworkContext = () => useContext(NetworkContext)
