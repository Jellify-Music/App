import { createMMKV } from 'react-native-mmkv'

import RNFS from 'react-native-fs'
import JellifyTrack from '../../../types/JellifyTrack'
import axios from 'axios'
import {
	JellifyDownload,
	JellifyDownloadProgress,
	JellifyDownloadProgressState,
} from '../../../types/JellifyDownload'
import { queryClient } from '../../../constants/query-client'
import { AUDIO_CACHE_QUERY } from '../../queries/download/constants'

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

export async function downloadJellyfinFile(
	url: string,
	name: string,
	songName: string,
	setDownloadProgress: JellifyDownloadProgressState,
	preferredExtension?: string | null,
): Promise<DownloadedFileInfo> {
	try {
		const urlExtension = normalizeExtension(getExtensionFromUrl(url))
		const hintedExtension = normalizeExtension(preferredExtension)

		let extension = urlExtension ?? hintedExtension ?? null

		if (!extension) {
			try {
				const headRes = await axios.head(url)
				const headExtension = extensionFromContentType(headRes.headers['content-type'])
				if (headExtension) extension = headExtension
			} catch (error) {
				console.warn(
					'HEAD request failed when determining download type, using default',
					error,
				)
			}
		}

		if (!extension) extension = 'bin' // fallback without assuming a specific codec

		// Build path
		const fileName = `${name}.${extension}`
		const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`

		setDownloadProgress((prev: JellifyDownloadProgress) => ({
			...prev,
			[url]: { progress: 0, name: fileName, songName: songName },
		}))

		// Step 4: Start download with progress
		const options = {
			fromUrl: url,
			toFile: downloadDest,

			/* eslint-disable @typescript-eslint/no-explicit-any */
			begin: (res: any) => {},
			progress: (data: any) => {
				const percent = +(data.bytesWritten / data.contentLength).toFixed(2)

				setDownloadProgress((prev: JellifyDownloadProgress) => ({
					...prev,
					[url]: { progress: percent, name: fileName, songName: songName },
				}))
			},
			background: true,
			progressDivider: 1,
		}

		const result = await RNFS.downloadFile(options).promise

		const metadata = await RNFS.stat(downloadDest)

		return {
			uri: `file://${downloadDest}`,
			path: downloadDest,
			fileName,
			size: Number(metadata.size),
		}
	} catch (error) {
		console.error('Download failed:', error)
		throw error
	}
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

export const saveAudio = async (
	track: JellifyTrack,
	setDownloadProgress: JellifyDownloadProgressState,
	isAutoDownloaded: boolean = true,
): Promise<boolean> => {
	if (
		isAutoDownloaded &&
		AUDIO_CACHE_LIMIT &&
		(!Number.isFinite(AUDIO_CACHE_LIMIT) || AUDIO_CACHE_LIMIT <= 0)
	) {
		// If the cache limit is not set or is not a number, or is less than 0, Dont Auto Download
		return false
	}

	const existingRaw = mmkv.getString(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	let existingArray: JellifyDownload[] = []
	try {
		if (existingRaw) {
			existingArray = JSON.parse(existingRaw)
		}
	} catch (error) {
		//Ignore
	}

	try {
		const downloadedTrackFile = await downloadJellyfinFile(
			track.url,
			track.item.Id as string,
			track.title as string,
			setDownloadProgress,
			track.mediaSourceInfo?.Container,
		)
		let downloadedArtworkFile: DownloadedFileInfo | undefined
		if (track.artwork) {
			downloadedArtworkFile = await downloadJellyfinFile(
				track.artwork as string,
				track.item.Id as string,
				track.title as string,
				setDownloadProgress,
				undefined,
			)
		}
		track.url = downloadedTrackFile.uri
		if (downloadedArtworkFile) track.artwork = downloadedArtworkFile.uri

		const index = existingArray.findIndex((t) => t.item.Id === track.item.Id)

		const downloadEntry: JellifyDownload = {
			...track,
			savedAt: new Date().toISOString(),
			isAutoDownloaded,
			path: downloadedTrackFile.uri,
			fileSizeBytes: downloadedTrackFile.size,
			artworkSizeBytes: downloadedArtworkFile?.size,
		}

		if (index >= 0) {
			// Replace existing
			existingArray[index] = downloadEntry
		} else {
			// Add new
			existingArray.push(downloadEntry)
		}
	} catch (error) {
		return false
	}
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(existingArray))
	queryClient.invalidateQueries(AUDIO_CACHE_QUERY)
	return true
}

export const deleteAudio = async (itemId: string | undefined | null) => {
	if (!itemId) return
	await deleteDownloadsByIds([itemId])
}

const setAudioCache = (downloads: JellifyDownload[]) => {
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(downloads))
}

export const getAudioCache = (): JellifyDownload[] => {
	const existingRaw = mmkv.getString(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	let existingArray: JellifyDownload[] = []
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

const deleteDownloadAssets = async (download: JellifyDownload): Promise<number> => {
	let freedBytes = 0
	freedBytes += await deleteLocalFileIfExists(download.path, download.fileSizeBytes)
	freedBytes += await deleteLocalFileIfExists(download.artwork, download.artworkSizeBytes)
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
	const remaining: JellifyDownload[] = []
	let freedBytes = 0
	let deletedCount = 0
	let failedCount = 0

	for (const download of downloads) {
		if (!targets.has(download.item.Id as string)) {
			remaining.push(download)
			continue
		}

		try {
			freedBytes += await deleteDownloadAssets(download)
			deletedCount += 1
		} catch (error) {
			failedCount += 1
			remaining.push(download)
			console.error('Failed to delete download', download.item.Id, error)
		}
	}

	setAudioCache(remaining)
	queryClient.invalidateQueries(AUDIO_CACHE_QUERY)

	return {
		deletedCount,
		failedCount,
		freedBytes,
	}
}

export const deleteAudioCache = async (): Promise<DeleteDownloadsResult> => {
	const downloads = getAudioCache()
	const result = await deleteDownloadsByIds(downloads.map((download) => download.item.Id))
	mmkv.remove(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	return result
}

export const purneAudioCache = async () => {
	const existingRaw = mmkv.getString(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
	if (!existingRaw) return

	let existingArray: JellifyDownload[] = []

	try {
		existingArray = JSON.parse(existingRaw)
	} catch (e) {
		return
	}

	const autoDownloads = existingArray
		.filter((item) => item.isAutoDownloaded)
		.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()) // oldest first

	const excess = autoDownloads.length - (AUDIO_CACHE_LIMIT ?? 20)
	if (excess <= 0) return

	// Remove the oldest `excess` files
	const itemsToDelete = autoDownloads.slice(0, excess)
	for (const item of itemsToDelete) {
		await deleteDownloadAssets(item)
		existingArray = existingArray.filter((i) => i.item.Id !== item.item.Id)
	}

	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(existingArray))
}

export const setAudioCacheLimit = (limit: number) => {
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT, limit)
}

export const getAudioCacheLimit = () => {
	return mmkv.getNumber(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE_LIMIT)
}
