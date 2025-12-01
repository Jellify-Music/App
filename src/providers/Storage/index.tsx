import React, { PropsWithChildren, createContext, useContext, useState } from 'react'
import { useAllDownloadedTracks, useStorageInUse } from '../../api/queries/download'
import { JellifyDownload, JellifyDownloadProgress } from '../../types/JellifyDownload'
import {
	DeleteDownloadsResult,
	deleteDownloadsByIds,
} from '../../api/mutations/download/offlineModeUtils'
import { useNetworkContext } from '../Network'

export type StorageSummary = {
	totalSpace: number
	freeSpace: number
	usedByDownloads: number
	usedPercentage: number
	downloadCount: number
	autoDownloadCount: number
	manualDownloadCount: number
	artworkBytes: number
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
	downloads: JellifyDownload[] | undefined
	summary: StorageSummary | undefined
	suggestions: CleanupSuggestion[]
	selection: StorageSelectionState
	toggleSelection: (itemId: string) => void
	clearSelection: () => void
	deleteSelection: () => Promise<DeleteDownloadsResult | undefined>
	deleteDownloads: (itemIds: string[]) => Promise<DeleteDownloadsResult | undefined>
	isDeleting: boolean
	refresh: () => Promise<void>
	refreshing: boolean
	activeDownloadsCount: number
	activeDownloads: JellifyDownloadProgress | undefined
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined)

const THIRTY_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 30
const LARGE_DOWNLOAD_THRESHOLD = 50 * 1024 * 1024 // 50MB

const sumDownloadBytes = (download: JellifyDownload | undefined) => {
	if (!download) return 0
	return (download.fileSizeBytes ?? 0) + (download.artworkSizeBytes ?? 0)
}

export function StorageProvider({ children }: PropsWithChildren): React.JSX.Element {
	const {
		data: downloads,
		refetch: refetchDownloads,
		isFetching: isFetchingDownloads,
	} = useAllDownloadedTracks()
	const {
		data: storageInfo,
		refetch: refetchStorageInfo,
		isFetching: isFetchingStorage,
	} = useStorageInUse()
	const { activeDownloads } = useNetworkContext()

	const [selection, setSelection] = useState<StorageSelectionState>({})
	const [isDeleting, setIsDeleting] = useState(false)
	const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false)

	const activeDownloadsCount = Object.keys(activeDownloads ?? {}).length

	const summary: StorageSummary | undefined = (() => {
		if (!downloads || !storageInfo) return undefined

		const audioBytes = downloads.reduce(
			(acc, download) => acc + (download.fileSizeBytes ?? 0),
			0,
		)
		const artworkBytes = downloads.reduce(
			(acc, download) => acc + (download.artworkSizeBytes ?? 0),
			0,
		)
		const usedByDownloads = audioBytes + artworkBytes

		return {
			totalSpace: storageInfo.totalStorage,
			freeSpace: storageInfo.freeSpace,
			usedByDownloads,
			usedPercentage:
				storageInfo.totalStorage > 0 ? usedByDownloads / storageInfo.totalStorage : 0,
			downloadCount: downloads.length,
			autoDownloadCount: downloads.filter((download) => download.isAutoDownloaded).length,
			manualDownloadCount: downloads.filter((download) => !download.isAutoDownloaded).length,
			artworkBytes,
			audioBytes,
		}
	})()

	const suggestions: CleanupSuggestion[] = (() => {
		if (!downloads || downloads.length === 0) return []

		const now = Date.now()
		const staleDownloads = downloads.filter((download) => {
			const savedAt = new Date(download.savedAt).getTime()
			return Number.isFinite(savedAt) && now - savedAt > THIRTY_DAYS_IN_MS
		})

		const autoDownloads = downloads.filter((download) => download.isAutoDownloaded)
		const largeDownloads = downloads.filter(
			(download) => (download.fileSizeBytes ?? 0) > LARGE_DOWNLOAD_THRESHOLD,
		)

		const list: CleanupSuggestion[] = []

		if (staleDownloads.length)
			list.push({
				id: 'stale-downloads',
				title: 'Unused in 30+ days',
				description: 'Remove tracks you have not touched recently.',
				itemIds: staleDownloads.map((download) => download.item.Id as string),
				freedBytes: staleDownloads.reduce(
					(acc, download) => acc + sumDownloadBytes(download),
					0,
				),
				count: staleDownloads.length,
			})

		if (autoDownloads.length)
			list.push({
				id: 'auto-downloads',
				title: 'Auto cached tracks',
				description: 'Trim automatically cached music to reclaim space quickly.',
				itemIds: autoDownloads.map((download) => download.item.Id as string),
				freedBytes: autoDownloads.reduce(
					(acc, download) => acc + sumDownloadBytes(download),
					0,
				),
				count: autoDownloads.length,
			})

		if (largeDownloads.length)
			list.push({
				id: 'large-downloads',
				title: 'Large files',
				description: 'High bitrate albums occupying the most space.',
				itemIds: largeDownloads.map((download) => download.item.Id as string),
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

	const deleteDownloads = async (
		itemIds: string[],
	): Promise<DeleteDownloadsResult | undefined> => {
		if (!itemIds.length) return undefined
		setIsDeleting(true)
		try {
			const result = await deleteDownloadsByIds(itemIds)
			await Promise.all([refetchDownloads(), refetchStorageInfo()])
			setSelection((prev) => {
				const updated = { ...prev }
				itemIds.forEach((id) => delete updated[id])
				return updated
			})
			return result
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

	const refreshing = isFetchingDownloads || isFetchingStorage || isManuallyRefreshing

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
		refreshing,
		activeDownloadsCount,
		activeDownloads,
	}

	return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
}

export const useStorageContext = () => {
	const context = useContext(StorageContext)
	if (!context) throw new Error('StorageContext must be used within a StorageProvider')
	return context
}
