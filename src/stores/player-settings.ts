import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type PlayerSettingsStore = {
	displayAudioQualityBadge: boolean
	setDisplayAudioQualityBadge: (displayAudioQualityBadge: boolean) => void
}

export const usePlayerSettingsStore = create<PlayerSettingsStore>()(
	devtools(
		persist(
			(set) => ({
				displayAudioQualityBadge: false,
				setDisplayAudioQualityBadge: (displayAudioQualityBadge) =>
					set({ displayAudioQualityBadge }),
			}),
			{
				name: 'player-settings-storage',
			},
		),
	),
)

export const useDisplayAudioQualityBadge: () => [
	boolean,
	(displayAudioQualityBadge: boolean) => void,
] = () => {
	const displayAudioQualityBadge = usePlayerSettingsStore(
		(state) => state.displayAudioQualityBadge,
	)

	const setDisplayAudioQualityBadge = usePlayerSettingsStore(
		(state) => state.setDisplayAudioQualityBadge,
	)

	return [displayAudioQualityBadge, setDisplayAudioQualityBadge]
}
export const useSetDisplayAudioQualityBadge = () =>
	usePlayerSettingsStore((state) => state.setDisplayAudioQualityBadge)
