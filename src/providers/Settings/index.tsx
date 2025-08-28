import { Platform } from 'react-native'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import { useEffect, useState, useMemo } from 'react'
import { createContext, useContextSelector } from 'use-context-selector'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../stores/device-profile'
import { getDeviceProfile } from './utils'

export type DownloadQuality = 'original' | 'high' | 'medium' | 'low'
export type StreamingQuality = 'original' | 'high' | 'medium' | 'low'
export type Theme = 'system' | 'light' | 'dark'

interface SettingsContext {
	sendMetrics: boolean
	setSendMetrics: React.Dispatch<React.SetStateAction<boolean>>
	autoDownload: boolean
	setAutoDownload: React.Dispatch<React.SetStateAction<boolean>>
	devTools: boolean
	setDevTools: React.Dispatch<React.SetStateAction<boolean>>
	downloadQuality: DownloadQuality
	setDownloadQuality: React.Dispatch<React.SetStateAction<DownloadQuality>>
	streamingQuality: StreamingQuality
	setStreamingQuality: React.Dispatch<React.SetStateAction<StreamingQuality>>
	reducedHaptics: boolean
	setReducedHaptics: React.Dispatch<React.SetStateAction<boolean>>
	theme: Theme
	setTheme: React.Dispatch<React.SetStateAction<Theme>>
}

/**
 * Initializes the settings context
 *
 * By default, auto-download is enabled on iOS and Android
 *
 * By default, metrics and logs are not sent
 *
 * By default, streaming quality is set to 'high' for good balance of quality and bandwidth
 *
 * Settings are saved to the device storage
 *
 * @returns The settings context
 */
const SettingsContextInitializer = () => {
	const sendMetricsInit = storage.getBoolean(MMKVStorageKeys.SendMetrics)
	const autoDownloadInit = storage.getBoolean(MMKVStorageKeys.AutoDownload)
	const devToolsInit = storage.getBoolean(MMKVStorageKeys.DevTools)
	const reducedHapticsInit = storage.getBoolean(MMKVStorageKeys.ReducedHaptics)
	const themeInit = storage.getString(MMKVStorageKeys.Theme) as Theme

	const downloadQualityInit = storage.getString(
		MMKVStorageKeys.DownloadQuality,
	) as DownloadQuality

	const streamingQualityInit = storage.getString(
		MMKVStorageKeys.StreamingQuality,
	) as StreamingQuality

	const [sendMetrics, setSendMetrics] = useState(sendMetricsInit ?? false)

	const [autoDownload, setAutoDownload] = useState(
		autoDownloadInit ?? ['ios', 'android'].includes(Platform.OS),
	)
	const [devTools, setDevTools] = useState(false)

	const [downloadQuality, setDownloadQuality] = useState<DownloadQuality>(
		downloadQualityInit ?? 'original',
	)

	const [streamingQuality, setStreamingQuality] = useState<StreamingQuality>(
		streamingQualityInit ?? 'original',
	)

	const [reducedHaptics, setReducedHaptics] = useState(
		reducedHapticsInit ?? (Platform.OS !== 'ios' && Math.random() > 0.7),
	)

	const [theme, setTheme] = useState<Theme>(themeInit ?? 'system')

	const setStreamingDeviceProfile = useStreamingDeviceProfileStore(
		(state) => state.setDeviceProfile,
	)
	const setDownloadingDeviceProfile = useDownloadingDeviceProfileStore(
		(state) => state.setDeviceProfile,
	)

	useEffect(() => {
		storage.set(MMKVStorageKeys.SendMetrics, sendMetrics)
	}, [sendMetrics])

	useEffect(() => {
		storage.set(MMKVStorageKeys.AutoDownload, autoDownload)
	}, [autoDownload])

	useEffect(() => {
		storage.set(MMKVStorageKeys.DownloadQuality, downloadQuality)

		setDownloadingDeviceProfile(getDeviceProfile(downloadQuality, 'download'))
	}, [downloadQuality])

	useEffect(() => {
		storage.set(MMKVStorageKeys.StreamingQuality, streamingQuality)

		setStreamingDeviceProfile(getDeviceProfile(streamingQuality, 'stream'))
	}, [streamingQuality])

	useEffect(() => {
		storage.set(MMKVStorageKeys.DevTools, devTools)
	}, [devTools])

	useEffect(() => {
		storage.set(MMKVStorageKeys.ReducedHaptics, reducedHaptics)
	}, [reducedHaptics])

	useEffect(() => {
		storage.set(MMKVStorageKeys.Theme, theme)
	}, [theme])

	return {
		sendMetrics,
		setSendMetrics,
		autoDownload,
		setAutoDownload,
		devTools,
		setDevTools,
		downloadQuality,
		setDownloadQuality,
		streamingQuality,
		setStreamingQuality,
		reducedHaptics,
		setReducedHaptics,
		theme,
		setTheme,
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
	streamingQuality: 'high',
	setStreamingQuality: () => {},
	reducedHaptics: false,
	setReducedHaptics: () => {},
	theme: 'system',
	setTheme: () => {},
})

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const context = SettingsContextInitializer()

	// Memoize the context value to prevent unnecessary re-renders
	const value = useMemo(
		() => context,
		[
			context.sendMetrics,
			context.autoDownload,
			context.devTools,
			context.downloadQuality,
			context.streamingQuality,
			context.reducedHaptics,
			context.theme,
		],
	)

	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSendMetricsContext = () =>
	useContextSelector(SettingsContext, (context) => context.sendMetrics)
export const useSetSendMetricsContext = () =>
	useContextSelector(SettingsContext, (context) => context.setSendMetrics)

export const useAutoDownloadContext = () =>
	useContextSelector(SettingsContext, (context) => context.autoDownload)
export const useSetAutoDownloadContext = () =>
	useContextSelector(SettingsContext, (context) => context.setAutoDownload)

export const useDevToolsContext = () =>
	useContextSelector(SettingsContext, (context) => context.devTools)
export const useSetDevToolsContext = () =>
	useContextSelector(SettingsContext, (context) => context.setDevTools)

export const useDownloadQualityContext = () =>
	useContextSelector(SettingsContext, (context) => context.downloadQuality)
export const useSetDownloadQualityContext = () =>
	useContextSelector(SettingsContext, (context) => context.setDownloadQuality)

export const useStreamingQualityContext = () =>
	useContextSelector(SettingsContext, (context) => context.streamingQuality)
export const useSetStreamingQualityContext = () =>
	useContextSelector(SettingsContext, (context) => context.setStreamingQuality)

export const useReducedHapticsContext = () =>
	useContextSelector(SettingsContext, (context) => context.reducedHaptics)
export const useSetReducedHapticsContext = () =>
	useContextSelector(SettingsContext, (context) => context.setReducedHaptics)

export const useThemeSettingContext = () =>
	useContextSelector(SettingsContext, (context) => context.theme)
export const useSetThemeSettingContext = () =>
	useContextSelector(SettingsContext, (context) => context.setTheme)
