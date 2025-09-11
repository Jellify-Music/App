import { MMKV } from 'react-native-mmkv'

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

export async function downloadJellyfinFile(
	url: string,
	name: string,
	songName: string,
	setDownloadProgress: JellifyDownloadProgressState,
) {
	try {
		// Fetch the file
		const headRes = await axios.head(url)
		const contentType = headRes.headers['content-type']

		// Step 2: Get extension from content-type
		let extension = 'mp3' // default extension
		if (contentType && contentType.includes('/')) {
			const parts = contentType.split('/')
			const container = parts[1].split(';')[0] // handles "audio/m4a; charset=utf-8"
			container !== 'mpeg' && (extension = container) // don't use mpeg as an extension, use the default extension
		}

		// Step 3: Build path
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
			begin: (res: any) => {
				console.log('Download started')
			},
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
		console.log('Download complete:', result)

		return `file://${downloadDest}`
	} catch (error) {
		console.error('Download failed:', error)
		throw error
	}
}

const mmkv = new MMKV({
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
		console.debug('Downloading audio')

		const downloadtrack = await downloadJellyfinFile(
			track.url,
			track.item.Id as string,
			track.title as string,
			setDownloadProgress,
		)
		const dowloadalbum = await downloadJellyfinFile(
			track.artwork as string,
			track.item.Id as string,
			track.title as string,
			setDownloadProgress,
		)
		console.log('downloadtrack', downloadtrack)
		if (downloadtrack) {
			track.url = downloadtrack
			track.artwork = dowloadalbum
		}

		const index = existingArray.findIndex((t) => t.item.Id === track.item.Id)

		if (index >= 0) {
			// Replace existing
			existingArray[index] = {
				...track,
				savedAt: new Date().toISOString(),
				isAutoDownloaded,
				path: downloadtrack,
			}
		} else {
			// Add new
			existingArray.push({
				...track,
				savedAt: new Date().toISOString(),
				isAutoDownloaded,
				path: downloadtrack,
			})
		}
	} catch (error) {
		return false
	}
	mmkv.set(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE, JSON.stringify(existingArray))
	queryClient.invalidateQueries(AUDIO_CACHE_QUERY)
	return true
}

export const deleteAudio = async (itemId: string | undefined | null) => {
	const downloads = getAudioCache()

	const download = downloads.filter((download) => download.item.Id === itemId)

	if (download.length === 1) {
		RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${download[0].item.Id}`)
		setAudioCache([
			...downloads.slice(0, downloads.indexOf(download[0])),
			...downloads.slice(downloads.indexOf(download[0]) + 1, downloads.length - 1),
		])
	}
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

export const deleteAudioCache = async () => {
	mmkv.delete(MMKV_OFFLINE_MODE_KEYS.AUDIO_CACHE)
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
		// Delete audio file
		if (item.url && (await RNFS.exists(item.url))) {
			await RNFS.unlink(item.url).catch(() => {})
		}

		// Delete artwork
		if (item.artwork && (await RNFS.exists(item.artwork))) {
			await RNFS.unlink(item.artwork).catch(() => {})
		}

		// Remove from the existingArray
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
