/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMMKV } from 'react-native-mmkv'

import RNFS from 'react-native-fs'

type DownloadedFileInfo = {
	uri: string
	path: string
	fileName: string
	size: number
}

const getExtensionFromUrl = (url: string): string | null => {
	const sanitized = url.split('?')[0]
	const lastSegment = sanitized.split('/').pop() ?? ''
	const match = lastSegment.match(/\.([a-zA-Z0-9]+)$/)
	return match?.[1] ?? null
}

const normalizeExtension = (ext: string | undefined | null) => {
	if (!ext) return null

	let extension

	const clean = ext.toLowerCase()

	if (clean.includes('mpeg')) extension = 'mp3'
	else if (clean.includes('m4a')) extension = 'm4a'
	else extension = clean

	return extension
}

const extensionFromContentType = (contentType: string | undefined): string | null => {
	if (!contentType) return null
	if (!contentType.includes('/')) return null
	const [, subtypeRaw] = contentType.split('/')
	const container = subtypeRaw.split(';')[0]
	return normalizeExtension(container)
}

export type DeleteDownloadsResult = {
	deletedCount: number
	freedBytes: number
	failedCount: number
}

const mmkv = createMMKV({
	id: 'offlineMode',
	encryptionKey: 'offlineMode',
})

const MMKV_OFFLINE_MODE_KEYS = {
	AUDIO_CACHE: 'audioCache',
	AUDIO_CACHE_LIMIT: 'audioCacheLimit',
}

export const getDefaultAudioCacheLimit = () => {
	if (!mmkv.contains(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT)) {
		mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT, 20)
	}
}

getDefaultAudioCacheLimit()
const AUDIO_CACHE_LIMIT = mmkv.getNumber(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT)

export const deleteAudio = async (itemId: string | undefined | null) => {
	if (!itemId) return
	await deleteDownloadsByIds([itemId])
}

const setAudioCache = (downloads: unknown[]) => {
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(downloads))
}

export const getAudioCache = (): unknown[] => {
	const existingRaw = mmkv.getString(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	let existingArray: unknown[] = []
	try {
		if (existingRaw) {
			existingArray = JSON.parse(existingRaw)
		}
	} catch (error) {
		//Ignore
	}
	return existingArray
}

const stripFileScheme = (path: string) => path.replace('file://', '')

const isLocalFile = (path: string) =>
	path.startsWith('file://') || path.startsWith(RNFS.DocumentDirectoryPath)

const deleteLocalFileIfExists = async (
	path: string | undefined,
	fallbackSize?: number,
): Promise<number> => {
	if (!path || !isLocalFile(path)) return 0

	const normalizedPath = stripFileScheme(path)
	try {
		const exists = await RNFS.exists(normalizedPath)
		let size = fallbackSize ?? 0
		if (exists && !fallbackSize) {
			const stat = await RNFS.stat(normalizedPath)
			size = Number(stat.size)
		}
		if (exists) await RNFS.unlink(normalizedPath)
		return size
	} catch (error) {
		console.warn('Failed to delete file', normalizedPath, error)
		return 0
	}
}

const deleteDownloadAssets = async (download: unknown): Promise<number> => {
	let freedBytes = 0
	freedBytes += await deleteLocalFileIfExists(
		(download as any).path,
		(download as any).fileSizeBytes,
	)
	freedBytes += await deleteLocalFileIfExists(
		(download as any).artwork,
		(download as any).artworkSizeBytes,
	)
	return freedBytes
}

export const deleteDownloadsByIds = async (
	itemIds: (string | null | undefined)[],
): Promise<DeleteDownloadsResult> => {
	const targets = new Set(itemIds.filter(Boolean) as string[])
	if (targets.size === 0)
		return {
			deletedCount: 0,
			failedCount: 0,
			freedBytes: 0,
		}

	const downloads = getAudioCache()
	const remaining: unknown[] = []
	let freedBytes = 0
	let deletedCount = 0
	let failedCount = 0

	for (const download of downloads) {
		if (!targets.has((download as any).item.Id as string)) {
			remaining.push(download)
			continue
		}

		try {
			freedBytes += await deleteDownloadAssets(download)
			deletedCount += 1
		} catch (error) {
			failedCount += 1
			remaining.push(download)
			console.error('Failed to delete download', (download as any).item.Id, error)
		}
	}

	setAudioCache(remaining)

	return {
		deletedCount,
		failedCount,
		freedBytes,
	}
}

export const deleteAudioCache = async (): Promise<DeleteDownloadsResult> => {
	const downloads = getAudioCache()
	const result = await deleteDownloadsByIds(
		downloads.map((download) => (download as any).item.Id),
	)
	mmkv.remove(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	return result
}

export const purneAudioCache = async () => {
	const existingRaw = mmkv.getString(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	if (!existingRaw) return

	let existingArray: unknown[] = []

	try {
		existingArray = JSON.parse(existingRaw)
	} catch (e) {
		return
	}

	const autoDownloads = existingArray
		.filter((item) => (item as any).isAutoDownloaded)
		.sort(
			(a, b) =>
				new Date((a as any).savedAt).getTime() - new Date((b as any).savedAt).getTime(),
		) // oldest first

	const excess = autoDownloads.length - (AUDIO_CACHE_LIMIT ?? 20)
	if (excess <= 0) return

	// Remove the oldest `excess` files
	const itemsToDelete = autoDownloads.slice(0, excess)
	for (const item of itemsToDelete) {
		await deleteDownloadAssets(item)
		existingArray = existingArray.filter((i) => (i as any).item.Id !== (item as any).item.Id)
	}

	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(existingArray))
}

export const setAudioCacheLimit = (limit: number) => {
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT, limit)
}

export const getAudioCacheLimit = () => {
	return mmkv.getNumber(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT)
}
