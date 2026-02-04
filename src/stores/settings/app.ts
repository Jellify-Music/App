import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

export type ThemeSetting = 'system' | 'light' | 'dark' | 'oled'
export type ColorPreset = 'purple' | 'ocean' | 'forest' | 'sunset' | 'peanut'

type AppSettingsStore = {
	sendMetrics: boolean
	setSendMetrics: (sendMetrics: boolean) => void

	hideRunTimes: boolean
	setHideRunTimes: (hideRunTimes: boolean) => void

	reducedHaptics: boolean
	setReducedHaptics: (reducedHaptics: boolean) => void

	theme: ThemeSetting
	setTheme: (theme: ThemeSetting) => void

	colorPreset: ColorPreset
	setColorPreset: (colorPreset: ColorPreset) => void
}

export const useAppSettingsStore = create<AppSettingsStore>()(
	devtools(
		persist(
			(set): AppSettingsStore => ({
				sendMetrics: false,
				setSendMetrics: (sendMetrics: boolean) => set({ sendMetrics }),

				hideRunTimes: false,
				setHideRunTimes: (hideRunTimes: boolean) => set({ hideRunTimes }),

				reducedHaptics: false,
				setReducedHaptics: (reducedHaptics: boolean) => set({ reducedHaptics }),

				theme: 'system',
				setTheme: (theme: ThemeSetting) => set({ theme }),

				colorPreset: 'purple',
				setColorPreset: (colorPreset: ColorPreset) => set({ colorPreset }),
			}),
			{
				name: 'app-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useThemeSetting: () => [ThemeSetting, (theme: ThemeSetting) => void] = () => {
	const theme = useAppSettingsStore((state) => state.theme)

	const setTheme = useAppSettingsStore((state) => state.setTheme)

	return [theme, setTheme]
}

export const useColorPresetSetting: () => [
	ColorPreset,
	(colorPreset: ColorPreset) => void,
] = () => {
	const colorPreset = useAppSettingsStore((state) => state.colorPreset)

	const setColorPreset = useAppSettingsStore((state) => state.setColorPreset)

	return [colorPreset, setColorPreset]
}

export const useReducedHapticsSetting: () => [boolean, (reducedHaptics: boolean) => void] = () => {
	const reducedHaptics = useAppSettingsStore((state) => state.reducedHaptics)

	const setReducedHaptics = useAppSettingsStore((state) => state.setReducedHaptics)

	return [reducedHaptics, setReducedHaptics]
}

export const useSendMetricsSetting: () => [boolean, (sendMetrics: boolean) => void] = () => {
	const sendMetrics = useAppSettingsStore((state) => state.sendMetrics)

	const setSendMetrics = useAppSettingsStore((state) => state.setSendMetrics)

	return [sendMetrics, setSendMetrics]
}

export const useHideRunTimesSetting: () => [boolean, (hideRunTimes: boolean) => void] = () =>
	useAppSettingsStore(useShallow((state) => [state.hideRunTimes, state.setHideRunTimes]))
