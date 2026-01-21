import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'
import { create } from 'zustand'

export type SearchFilterType = 'All' | 'Artists' | 'Albums' | 'Tracks'

type SearchStore = {
	// Filter state
	selectedFilter: SearchFilterType
	setSelectedFilter: (filter: SearchFilterType) => void

	// Favorites filter (mirrors library behavior)
	isFavorites: boolean | undefined
	setIsFavorites: (isFavorites: boolean | undefined) => void

	// Downloaded filter (only applies to tracks)
	isDownloaded: boolean
	setIsDownloaded: (isDownloaded: boolean) => void

	// Reset filters to defaults
	resetFilters: () => void
}

const useSearchStore = create<SearchStore>()(
	devtools(
		persist(
			(set) => ({
				selectedFilter: 'All',
				setSelectedFilter: (selectedFilter: SearchFilterType) => set({ selectedFilter }),

				isFavorites: undefined,
				setIsFavorites: (isFavorites: boolean | undefined) => set({ isFavorites }),

				isDownloaded: false,
				setIsDownloaded: (isDownloaded: boolean) => set({ isDownloaded }),

				resetFilters: () =>
					set({
						selectedFilter: 'All',
						isFavorites: undefined,
						isDownloaded: false,
					}),
			}),
			{
				name: 'search-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export default useSearchStore
