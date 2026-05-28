import { mmkvStateStorage } from '../../constants/storage'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

type ArtistLibraryStore = {
	sortBy: ItemSortBy
	setSortBy: (sortBy: ItemSortBy) => void

	sortDescending: boolean
	setSortDescending: (sortDescending: boolean) => void

	isFavorites: boolean | undefined
	setIsFavorites: (isFavorites: boolean | undefined) => void

	genreIds: string[]
	setGenreIds: (genreIds: string[]) => void
}

export const useArtistLibraryStore = create<ArtistLibraryStore>()(
	devtools(
		persist(
			(set) => ({
				sortBy: ItemSortBy.SortName,
				setSortBy: (sortBy) => set({ sortBy }),

				sortDescending: false,
				setSortDescending: (sortDescending) => set({ sortDescending }),

				isFavorites: undefined,
				setIsFavorites: (isFavorites) => set({ isFavorites }),

				genreIds: [],
				setGenreIds: (genreIds) => set({ genreIds }),
			}),
			{
				name: 'artist-library-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)
