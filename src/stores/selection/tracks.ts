import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { devtools } from 'zustand/middleware'
import { create } from 'zustand'

type TrackSelectionState = {
	isSelecting: boolean
	activeContext: string | null
	selection: Record<string, BaseItemDto>
	beginSelection: (context?: string | null) => void
	endSelection: () => void
	clearSelection: () => void
	toggleTrack: (track: BaseItemDto) => void
}

const useTrackSelectionStore = create<TrackSelectionState>()(
	devtools((set) => ({
		isSelecting: false,
		activeContext: null,
		selection: {},
		beginSelection: (context) =>
			set((state) => ({
				isSelecting: true,
				activeContext: context ?? null,
				selection:
					state.activeContext && state.activeContext === (context ?? null)
						? state.selection
						: {},
			})),
		endSelection: () => set({ isSelecting: false, activeContext: null, selection: {} }),
		clearSelection: () => set({ selection: {} }),
		toggleTrack: (track) =>
			set((state) => {
				if (!track.Id || !state.isSelecting) return state
				const selection = { ...state.selection }
				if (selection[track.Id]) delete selection[track.Id]
				else selection[track.Id] = track
				return { selection }
			}),
	})),
)

export default useTrackSelectionStore
