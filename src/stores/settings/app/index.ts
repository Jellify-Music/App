import { Settings } from 'react-native-pulsar'
import { mmkvStateStorage } from '../../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import AppSettingsStore, { ColorPreset, ThemeSetting } from './types'
import { setReducedHaptics } from './utils/set'
import { migrate } from './utils/migrate'

export type { ColorPreset, ThemeSetting } from './types'

export const useAppSettingsStore = create<AppSettingsStore>()(
	devtools(
		persist(
			(set): AppSettingsStore => ({
				sendMetrics: false,
				setSendMetrics: (sendMetrics: boolean) => set({ sendMetrics }),

				hideRunTimes: false,
				setHideRunTimes: (hideRunTimes: boolean) => set({ hideRunTimes }),

				reducedHaptics: false,

				setReducedHaptics: setReducedHaptics(set),

				theme: 'system',
				setTheme: (theme: ThemeSetting) => set({ theme }),

				hideItemIndicators: false,
				setHideItemIndicators: (hideItemIndicators: boolean) => set({ hideItemIndicators }),

				colorPreset: 'haze',
				setColorPreset: (colorPreset: ColorPreset) => set({ colorPreset }),
			}),
			{
				name: 'app-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
				version: 1,
				migrate,
				onRehydrateStorage: ({ reducedHaptics }) => {
					Settings.enableHaptics(!reducedHaptics)
				},
			},
		),
	),
)

export const getSendMetricsSetting = () => useAppSettingsStore.getState().sendMetrics

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
