import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'
import { create } from 'zustand'

type TabFilterState = {
	isFavorites: boolean | undefined
	isDownloaded?: boolean // Only for Tracks tab
}

type LibraryStore = {
	sortDescending: boolean
	setSortDescending: (sortDescending: boolean) => void
	filters: {
		tracks: TabFilterState
		albums: TabFilterState
		artists: TabFilterState
	}
	setTracksFilters: (filters: Partial<TabFilterState>) => void
	setAlbumsFilters: (filters: Partial<TabFilterState>) => void
	setArtistsFilters: (filters: Partial<TabFilterState>) => void
	// Legacy getters for backward compatibility during migration
	getFiltersForTab: (tab: 'Tracks' | 'Albums' | 'Artists') => TabFilterState
}

const useLibraryStore = create<LibraryStore>()(
	devtools(
		persist(
			(set, get) => ({
				sortDescending: false,
				setSortDescending: (sortDescending: boolean) => set({ sortDescending }),

				filters: {
					tracks: {
						isFavorites: undefined,
						isDownloaded: false,
					},
					albums: {
						isFavorites: undefined,
					},
					artists: {
						isFavorites: undefined,
					},
				},
				setTracksFilters: (filters: Partial<TabFilterState>) =>
					set((state) => ({
						filters: {
							...state.filters,
							tracks: { ...state.filters.tracks, ...filters },
						},
					})),
				setAlbumsFilters: (filters: Partial<TabFilterState>) =>
					set((state) => ({
						filters: {
							...state.filters,
							albums: { ...state.filters.albums, ...filters },
						},
					})),
				setArtistsFilters: (filters: Partial<TabFilterState>) =>
					set((state) => ({
						filters: {
							...state.filters,
							artists: { ...state.filters.artists, ...filters },
						},
					})),
				getFiltersForTab: (tab: 'Tracks' | 'Albums' | 'Artists') => {
					const state = get()
					return state.filters[tab.toLowerCase() as 'tracks' | 'albums' | 'artists']
				},
			}),
			{
				name: 'library-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export default useLibraryStore
