import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'
import { create } from 'zustand'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

export type LibraryTab = 'tracks' | 'albums' | 'artists'

type TabFilterState = {
	isFavorites: boolean | undefined
	isDownloaded?: boolean // Only for Tracks tab
	isUnplayed?: boolean // Only for Tracks tab
	genreIds?: string[] // Only for Tracks tab
	yearMin?: number // Tracks and Albums
	yearMax?: number // Tracks and Albums
}

type SortState = Record<LibraryTab, ItemSortBy>
type SortOrderState = Record<LibraryTab, boolean>

type LibraryStore = {
	sortBy: SortState
	sortDescending: SortOrderState
	setSortBy: (tab: LibraryTab, sortBy: ItemSortBy) => void
	setSortDescending: (tab: LibraryTab, sortDescending: boolean) => void
	getSortBy: (tab: LibraryTab) => ItemSortBy
	getSortDescending: (tab: LibraryTab) => boolean
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
				sortBy: {
					tracks: ItemSortBy.Name,
					albums: ItemSortBy.Name,
					artists: ItemSortBy.SortName,
				},
				sortDescending: {
					tracks: false,
					albums: false,
					artists: false,
				},
				setSortBy: (tab: LibraryTab, sortBy: ItemSortBy) =>
					set((state) => {
						const current = state.sortBy as SortState | string
						const next: SortState =
							typeof current === 'object' && current !== null && 'tracks' in current
								? { ...current, [tab]: sortBy }
								: {
										tracks: ItemSortBy.Name,
										albums: ItemSortBy.Name,
										artists: ItemSortBy.SortName,
										[tab]: sortBy,
									}
						return { sortBy: next }
					}),
				setSortDescending: (tab: LibraryTab, sortDescending: boolean) =>
					set((state) => {
						const current = state.sortDescending as SortOrderState | boolean
						const next: SortOrderState =
							typeof current === 'object' && current !== null && 'tracks' in current
								? { ...current, [tab]: sortDescending }
								: {
										tracks: false,
										albums: false,
										artists: false,
										[tab]: sortDescending,
									}
						return { sortDescending: next }
					}),
				getSortBy: (tab: LibraryTab) => {
					const sortBy = get().sortBy as SortState | string
					if (typeof sortBy === 'string') return sortBy as ItemSortBy
					return sortBy[tab] ?? ItemSortBy.Name
				},
				getSortDescending: (tab: LibraryTab) => {
					const sortDescending = get().sortDescending as SortOrderState | boolean
					if (typeof sortDescending === 'boolean') return sortDescending
					return sortDescending[tab] ?? false
				},

				filters: {
					tracks: {
						isFavorites: undefined,
						isDownloaded: false,
						isUnplayed: undefined,
						genreIds: undefined,
						yearMin: undefined,
						yearMax: undefined,
					},
					albums: {
						isFavorites: undefined,
						yearMin: undefined,
						yearMax: undefined,
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
