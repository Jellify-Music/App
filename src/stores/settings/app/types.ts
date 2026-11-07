import { StateCreator } from 'zustand'

export type ThemeSetting = 'system' | 'light' | 'dark' | 'oled'
export type ColorPreset = 'haze' | 'ocean' | 'forest' | 'sunset' | 'peanut'

type AppSettingsStoreMutators = [['zustand/devtools', never], ['zustand/persist', unknown]]

type AppSettingsStoreCreator = StateCreator<AppSettingsStore, AppSettingsStoreMutators>

export type AppSettingsStoreSet = Parameters<AppSettingsStoreCreator>[0]

type AppSettingsStore = {
	sendMetrics: boolean
	setSendMetrics: (sendMetrics: boolean) => void

	hideRunTimes: boolean
	setHideRunTimes: (hideRunTimes: boolean) => void

	reducedHaptics: boolean

	/**
	 * Sets the system setting for reduced haptics.
	 *
	 * Calls {@link Settings.enableHaptics} to enable / disable
	 * haptics in `react-native-pulsar`
	 *
	 * @param reducedHaptics Whether haptics should be reduced
	 */
	setReducedHaptics: (reducedHaptics: boolean) => void

	theme: ThemeSetting
	setTheme: (theme: ThemeSetting) => void

	/**
	 * Hides the triangular indicators on the corners of albums and playlists on the
	 * Home and Discover screens
	 */
	hideItemIndicators: boolean
	setHideItemIndicators: (hideItemIndicators: boolean) => void

	colorPreset: ColorPreset
	setColorPreset: (colorPreset: ColorPreset) => void
}

export default AppSettingsStore
