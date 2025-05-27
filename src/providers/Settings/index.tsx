import { Platform } from 'react-native'
import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import { createContext, useContext, useEffect, useState } from 'react'
import {
	DEFAULT_CROSSFADE_DURATION,
	DEFAULT_FADE_CURVE,
	DEFAULT_AUTO_CROSSFADE,
} from '../../player/gapless-config'

type FadeCurve = 'linear' | 'logarithmic' | 'exponential'

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
	// Crossfade settings
	crossfadeEnabled: boolean
	setCrossfadeEnabled: React.Dispatch<React.SetStateAction<boolean>>
	crossfadeDuration: number
	setCrossfadeDuration: React.Dispatch<React.SetStateAction<number>>
	crossfadeCurve: FadeCurve
	setCrossfadeCurve: React.Dispatch<React.SetStateAction<FadeCurve>>
	autoCrossfade: boolean
	setAutoCrossfade: React.Dispatch<React.SetStateAction<boolean>>
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
	// Crossfade settings initialization
	const crossfadeEnabledInit = storage.getBoolean(MMKVStorageKeys.CrossfadeEnabled)
	const crossfadeDurationInit = storage.getNumber(MMKVStorageKeys.CrossfadeDuration)
	const crossfadeCurveInit = storage.getString(MMKVStorageKeys.CrossfadeCurve) as FadeCurve
	const autoCrossfadeInit = storage.getBoolean(MMKVStorageKeys.AutoCrossfade)

	const [sendMetrics, setSendMetrics] = useState(sendMetricsInit ?? false)
	const [autoDownload, setAutoDownload] = useState(
		autoDownloadInit ?? ['ios', 'android'].includes(Platform.OS),
	)
	const [devTools, setDevTools] = useState(false)

	const [downloadQuality, setDownloadQuality] = useState<DownloadQuality>(
		downloadQualityInit ?? 'medium',
	)
	// Crossfade state
	const [crossfadeEnabled, setCrossfadeEnabled] = useState(crossfadeEnabledInit ?? true)
	const [crossfadeDuration, setCrossfadeDuration] = useState(
		crossfadeDurationInit ?? DEFAULT_CROSSFADE_DURATION,
	)
	const [crossfadeCurve, setCrossfadeCurve] = useState<FadeCurve>(
		crossfadeCurveInit ?? DEFAULT_FADE_CURVE,
	)
	const [autoCrossfade, setAutoCrossfade] = useState(autoCrossfadeInit ?? DEFAULT_AUTO_CROSSFADE)

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

	// Crossfade effects
	useEffect(() => {
		storage.set(MMKVStorageKeys.CrossfadeEnabled, crossfadeEnabled)
	}, [crossfadeEnabled])

	useEffect(() => {
		storage.set(MMKVStorageKeys.CrossfadeDuration, crossfadeDuration)
	}, [crossfadeDuration])

	useEffect(() => {
		storage.set(MMKVStorageKeys.CrossfadeCurve, crossfadeCurve)
	}, [crossfadeCurve])

	useEffect(() => {
		storage.set(MMKVStorageKeys.AutoCrossfade, autoCrossfade)
	}, [autoCrossfade])

	return {
		sendMetrics,
		setSendMetrics,
		autoDownload,
		setAutoDownload,
		devTools,
		setDevTools,
		downloadQuality,
		setDownloadQuality,
		crossfadeEnabled,
		setCrossfadeEnabled,
		crossfadeDuration,
		setCrossfadeDuration,
		crossfadeCurve,
		setCrossfadeCurve,
		autoCrossfade,
		setAutoCrossfade,
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
	crossfadeEnabled: false,
	setCrossfadeEnabled: () => {},
	crossfadeDuration: DEFAULT_CROSSFADE_DURATION,
	setCrossfadeDuration: () => {},
	crossfadeCurve: DEFAULT_FADE_CURVE,
	setCrossfadeCurve: () => {},
	autoCrossfade: DEFAULT_AUTO_CROSSFADE,
	setAutoCrossfade: () => {},
})

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
	const context = SettingsContextInitializer()

	return <SettingsContext.Provider value={context}>{children}</SettingsContext.Provider>
}

export const useSettingsContext = () => useContext(SettingsContext)
