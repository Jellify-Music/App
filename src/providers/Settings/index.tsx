import { Platform } from 'react-native'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import { createContext, useContext, useEffect, useState } from 'react'

export type DownloadQuality = 'original' | 'high' | 'medium' | 'low'

interface SettingsContext {
	sendMetrics: boolean
	setSendMetrics: React.Dispatch<React.SetStateAction<boolean>>
	autoDownload: boolean
	setAutoDownload: React.Dispatch<React.SetStateAction<boolean>>
	devTools: boolean
	setDevTools: React.Dispatch<React.SetStateAction<boolean>>
	downloadQuality: DownloadQuality
	setDownloadQuality: React.Dispatch<React.SetStateAction<DownloadQuality>>
}

/**
 * Initializes the settings context
 *
 * By default, auto-download is enabled on iOS and Android
 *
 * By default, metrics and logs are not sent
 *
 * Settings are saved to the device storage
 *
 * @returns The settings context
 */
const SettingsContextInitializer = () => {
	const sendMetricsInit = storage.getBoolean(MMKVStorageKeys.SendMetrics)
	const autoDownloadInit = storage.getBoolean(MMKVStorageKeys.AutoDownload)
	const devToolsInit = storage.getBoolean(MMKVStorageKeys.DevTools)

	const downloadQualityInit = storage.getString(
		MMKVStorageKeys.DownloadQuality,
	) as DownloadQuality

	const [sendMetrics, setSendMetrics] = useState(sendMetricsInit ?? false)

	const [autoDownload, setAutoDownload] = useState(
		autoDownloadInit ?? ['ios', 'android'].includes(Platform.OS),
	)
	const [devTools, setDevTools] = useState(false)

	const [downloadQuality, setDownloadQuality] = useState<DownloadQuality>(
		downloadQualityInit ?? 'medium',
	)

	useEffect(() => {
		storage.set(MMKVStorageKeys.SendMetrics, sendMetrics)
	}, [sendMetrics])

	useEffect(() => {
		storage.set(MMKVStorageKeys.AutoDownload, autoDownload)
	}, [autoDownload])

	useEffect(() => {
		storage.set(MMKVStorageKeys.DownloadQuality, downloadQuality)
	}, [downloadQuality])

	useEffect(() => {
		storage.set(MMKVStorageKeys.DevTools, devTools)
	}, [devTools])

	return {
		sendMetrics,
		setSendMetrics,
		autoDownload,
		setAutoDownload,
		devTools,
		setDevTools,
		downloadQuality,
		setDownloadQuality,
	}
}

export const SettingsContext = createContext<SettingsContext>({
	sendMetrics: false,
	setSendMetrics: () => {},
	autoDownload: false,
	setAutoDownload: () => {},
	devTools: false,
	setDevTools: () => {},
	downloadQuality: 'medium',
	setDownloadQuality: () => {},
})

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const context = SettingsContextInitializer()

	return <SettingsContext.Provider value={context}>{children}</SettingsContext.Provider>
}

export const useSettingsContext = () => useContext(SettingsContext)
