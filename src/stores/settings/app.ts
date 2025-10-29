import { stateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

export type ThemeSetting = 'system' | 'light' | 'dark' | 'oled'

type AppSettingsStore = {
	sendMetrics: boolean
	setSendMetrics: (sendMetrics: boolean) => void

	reducedHaptics: boolean
	setReducedHaptics: (reducedHaptics: boolean) => void

	theme: ThemeSetting
	setTheme: (theme: ThemeSetting) => void
}

export const useAppSettingsStore = create<AppSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				sendMetrics: false,
				setSendMetrics: (sendMetrics) => set({ sendMetrics }),

				reducedHaptics: false,
				setReducedHaptics: (reducedHaptics) => set({ reducedHaptics }),

				theme: 'system',
				setTheme: (theme) => set({ theme }),
			}),
			{
				name: 'app-settings-storage',
				storage: createJSONStorage(() => stateStorage),
			},
		),
	),
)

export const useThemeSetting: () => [ThemeSetting, (theme: ThemeSetting) => void] = () => {
	const theme = useAppSettingsStore((state) => state.theme)

	const setTheme = useAppSettingsStore((state) => state.setTheme)

	return [theme, setTheme]
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
