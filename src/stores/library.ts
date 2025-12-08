import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { mmkvStateStorage } from '../constants/storage'
import { create } from 'zustand'

type LibraryStore = {
	sortDescending: boolean
	setSortDescending: (sortDescending: boolean) => void
	isFavorites: boolean | undefined
	setIsFavorites: (isFavorites: boolean | undefined) => void
	isDownloaded: boolean
	setIsDownloaded: (isDownloaded: boolean) => void
}

const useLibraryStore = create<LibraryStore>()(
	devtools(
		persist(
			(set) => ({
				sortDescending: false,
				setSortDescending: (sortDescending: boolean) => set({ sortDescending }),

				isFavorites: undefined,
				setIsFavorites: (isFavorites: boolean | undefined) => set({ isFavorites }),

				isDownloaded: false,
				setIsDownloaded: (isDownloaded: boolean) => set({ isDownloaded }),
			}),
			{
				name: 'library-store',
				storage: createJSONStorage(() => mmkvStateStorage),
			},
		),
	),
)

export default useLibraryStore
