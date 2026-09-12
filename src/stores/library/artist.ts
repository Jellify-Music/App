import { ArtistsSortBy } from '@/src/types/sorting/artist'
import { mmkvStateStorage } from '../../constants/storage'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

type LibraryArtistsStore = {
	isFavorites: true | undefined
	setIsFavorites: (isFavorite: true | undefined) => void
	sortBy: ArtistsSortBy
	setSortBy: (sortBy: ArtistsSortBy) => void
	sortOrder: SortOrder
	setSortOrder: (sortOrder: SortOrder) => void
}

export const useLibraryArtistsStore = create<LibraryArtistsStore>()(
	devtools(
		persist(
			(set, get) => ({
				isFavorites: undefined,
				setIsFavorites: (isFavorites: true | undefined) => set({ isFavorites }),

				sortBy: ItemSortBy.DateLastContentAdded,
				setSortBy: (sortBy: ArtistsSortBy) => set({ sortBy }),

				sortOrder: SortOrder.Ascending,
				setSortOrder: (sortOrder: SortOrder) => set({ sortOrder }),
			}),
			{
				name: 'library-artists-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)
