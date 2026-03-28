import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'

const MAX_RECENT_SEARCHES = 20

type SearchStore = {
	recentSearches: string[]
	addRecentSearch: (term: string) => void
	removeRecentSearch: (term: string) => void
	clearRecentSearches: () => void
}

export const useSearchStore = create<SearchStore>()(
	devtools(
		persist(
			(set, get) => ({
				recentSearches: [],
				addRecentSearch: (term) => {
					const trimmed = term.trim()
					if (!trimmed) return
					const current = get().recentSearches.filter((s) => s !== trimmed)
					set({ recentSearches: [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES) })
				},
				removeRecentSearch: (term) => {
					set({ recentSearches: get().recentSearches.filter((s) => s !== term) })
				},
				clearRecentSearches: () => set({ recentSearches: [] }),
			}),
			{
				name: 'search-storage',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)
