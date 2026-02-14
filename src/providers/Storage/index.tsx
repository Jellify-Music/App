import React, { PropsWithChildren, createContext, use, useContext, useState } from 'react'
import { JellifyDownload, JellifyDownloadProgress } from '../../types/JellifyDownload'
import { useDownloadProgress } from '../../stores/network/downloads'
import {
	DownloadedTrack,
	DownloadManager,
	useDownloadedTracks,
	useDownloadStorage,
} from 'react-native-nitro-player'

export type StorageSummary = {
	totalSpace: number
	freeSpace: number
	usedByDownloads: number
	usedPercentage: number
	downloadCount: number
	audioBytes: number
}

export type CleanupSuggestion = {
	id: string
	title: string
	description: string
	itemIds: string[]
	freedBytes: number
	count: number
}

export type StorageSelectionState = Record<string, boolean>

interface StorageContextValue {
	downloads: DownloadedTrack[] | undefined
	summary: StorageSummary | undefined
	suggestions: CleanupSuggestion[]
	selection: StorageSelectionState
	toggleSelection: (itemId: string) => void
	clearSelection: () => void
	deleteSelection: () => Promise<void>
	deleteDownloads: (itemIds: string[]) => Promise<void>
	isDeleting: boolean
	refresh: () => Promise<void>
	activeDownloadsCount: number
	activeDownloads: JellifyDownloadProgress | undefined
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined)

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30
const LARGE_DOWNLOAD_THRESHOLD = 50 * 1024 * 1024 // 50MB

const sumDownloadBytes = (download: DownloadedTrack | undefined) => {
	if (!download) return 0
	return download.fileSize ?? 0
}

export function StorageProvider({ children }: PropsWithChildren): React.JSX.Element {
	const { downloadedTracks: downloads, refresh: refetchDownloads } = useDownloadedTracks()
	const { storageInfo: storageInfo, refresh: refetchStorageInfo } = useDownloadStorage()
	const activeDownloads = useDownloadProgress()

	const [selection, setSelection] = useState<StorageSelectionState>({})
	const [isDeleting, setIsDeleting] = useState(false)
	const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false)

	const activeDownloadsCount = Object.keys(activeDownloads ?? {}).length

	const summary: StorageSummary | undefined = (() => {
		if (!downloads || !storageInfo) return undefined

		const audioBytes = downloads.reduce((acc, download) => acc + (download.fileSize ?? 0), 0)
		const usedByDownloads = audioBytes

		return {
			totalSpace: storageInfo.totalSpace,
			freeSpace: storageInfo.availableSpace,
			usedByDownloads,
			usedPercentage:
				storageInfo.totalSpace > 0 ? usedByDownloads / storageInfo.totalSpace : 0,
			downloadCount: downloads.length,
			audioBytes,
		}
	})()

	const suggestions: CleanupSuggestion[] = (() => {
		if (!downloads || downloads.length === 0) return []

		const now = Date.now()
		const staleDownloads = downloads.filter((download) => {
			const savedAt = new Date(download.downloadedAt).getTime()
			return Number.isFinite(savedAt) && now - savedAt > THIRTY_DAYS_IN_MS
		})

		const largeDownloads = downloads.filter(
			(download) => (download.fileSize ?? 0) > LARGE_DOWNLOAD_THRESHOLD,
		)

		const list: CleanupSuggestion[] = []

		if (staleDownloads.length)
			list.push({
				id: 'stale-downloads',
				title: 'Unused in 30+ days',
				description: 'Remove tracks you have not touched recently.',
				itemIds: staleDownloads.map((download) => download.trackId),
				freedBytes: staleDownloads.reduce(
					(acc, download) => acc + sumDownloadBytes(download),
					0,
				),
				count: staleDownloads.length,
			})

		if (largeDownloads.length)
			list.push({
				id: 'large-downloads',
				title: 'Large files',
				description: 'High bitrate albums occupying the most space.',
				itemIds: largeDownloads.map((download) => download.trackId),
				freedBytes: largeDownloads.reduce(
					(acc, download) => acc + sumDownloadBytes(download),
					0,
				),
				count: largeDownloads.length,
			})

		return list
	})()

	const toggleSelection = (itemId: string) => {
		setSelection((prev) => ({
			...prev,
			[itemId]: !prev[itemId],
		}))
	}

	const clearSelection = () => setSelection({})

	const deleteDownloads = async (itemIds: string[]): Promise<void> => {
		if (!itemIds.length) return
		setIsDeleting(true)
		try {
			await Promise.all(itemIds.map((id) => DownloadManager.deleteDownloadedTrack(id)))
			await Promise.all([refetchDownloads(), refetchStorageInfo()])
			setSelection((prev) => {
				const updated = { ...prev }
				itemIds.forEach((id) => delete updated[id])
				return updated
			})
		} finally {
			setIsDeleting(false)
		}
	}

	const deleteSelection = async () => {
		const idsToDelete = Object.entries(selection)
			.filter(([, isSelected]) => isSelected)
			.map(([id]) => id)
		return deleteDownloads(idsToDelete)
	}

	const refresh = async () => {
		setIsManuallyRefreshing(true)
		try {
			await Promise.all([refetchDownloads(), refetchStorageInfo()])
		} finally {
			setIsManuallyRefreshing(false)
		}
	}

	const value: StorageContextValue = {
		downloads,
		summary,
		suggestions,
		selection,
		toggleSelection,
		clearSelection,
		deleteSelection,
		deleteDownloads,
		isDeleting,
		refresh,
		activeDownloadsCount,
		activeDownloads,
	}

	return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
}

export const useStorageContext = () => {
	const context = use(StorageContext)
	if (!context) throw new Error('StorageContext must be used within a StorageProvider')
	return context
}
