import { mmkvStateStorage } from '../../constants/storage'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client'
import { createJSONStorage, persist, devtools } from 'zustand/middleware'
import { create } from 'zustand'
import AlphabeticalPageParam from '@/src/api/types/page-params'

type ArtistLibraryStore = {
	sortBy: ItemSortBy
	setSortBy: (sortBy: ItemSortBy) => void
	sortDescending: boolean
	setSortDescending: (sortDescending: boolean) => void

	isFavorites: boolean | undefined
	setIsFavorites: (isFavorites: boolean | undefined) => void

	pendingLetter: AlphabeticalPageParam
	setPendingLetter: (letter: string) => void
}

const useArtistLibraryStore = create<ArtistLibraryStore>()(
	devtools(
		persist(
			(set, get) => ({
				sortBy: ItemSortBy.SortName,
				setSortBy: (sortBy: ItemSortBy) =>
					set((state) => ({
						...state,
						sortBy,
					})),
				sortDescending: false,
				setSortDescending: (sortDescending: boolean) =>
					set((state) => ({
						...state,
						sortDescending,
					})),

				isFavorites: undefined,
				setIsFavorites: (isFavorites: boolean | undefined) =>
					set((state) => ({
						...state,
						isFavorites,
					})),

				pendingLetter: {
					page: 0,
					letter: '',
				},
				setPendingLetter: (letter: string) =>
					set((state) => ({
						...state,
						pendingLetter: {
							letter,
							page: 0,
						},
					})),
			}),
			{
				name: 'artist-library-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export default useArtistLibraryStore
