import { mmkvStateStorage } from '../../constants/storage'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

type DeveloperSettingsStore = {
	developerOptionsEnabled: boolean
	setDeveloperOptionsEnabled: (enabled: boolean) => void

	prId: string
	setPrId: (prId: string) => void
}

export const useDeveloperSettingsStore = create<DeveloperSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				developerOptionsEnabled: false,
				setDeveloperOptionsEnabled: (developerOptionsEnabled) =>
					set({ developerOptionsEnabled }),

				prId: '',
				setPrId: (prId) => set({ prId }),
			}),
			{
				name: 'developer-settings-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export const useDeveloperOptionsEnabled: () => [boolean, (enabled: boolean) => void] = () => {
	const developerOptionsEnabled = useDeveloperSettingsStore(
		(state) => state.developerOptionsEnabled,
	)
	const setDeveloperOptionsEnabled = useDeveloperSettingsStore(
		(state) => state.setDeveloperOptionsEnabled,
	)
	return [developerOptionsEnabled, setDeveloperOptionsEnabled]
}

export const usePrId: () => [string, (prId: string) => void] = () => {
	const prId = useDeveloperSettingsStore((state) => state.prId)
	const setPrId = useDeveloperSettingsStore((state) => state.setPrId)
	return [prId, setPrId]
}
