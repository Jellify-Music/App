import { storage } from '../../constants/storage'
import { MMKVStorageKeys } from '../../enums/mmkv-storage-keys'
import { useContext, useEffect, useState } from 'react'
import { createContext } from 'react'

interface LibrarySortAndFilterContext {
	sortDescending: boolean
	setSortDescending: (sortDescending: boolean) => void
	isFavorites: boolean | undefined
	setIsFavorites: (isFavorites: boolean | undefined) => void
	isDownloaded: boolean
	setIsDownloaded: (isDownloaded: boolean) => void
}

const LibrarySortAndFilterContextInitializer = () => {
	const sortDescendingInit = storage.getBoolean(MMKVStorageKeys.LibrarySortDescending)
	const isFavoritesInit = storage.getBoolean(MMKVStorageKeys.LibraryIsFavorites)
	const isDownloadedInit = storage.getBoolean(MMKVStorageKeys.LibraryIsDownloaded)

	const [sortDescending, setSortDescending] = useState(sortDescendingInit ?? false)
	const [isFavorites, setIsFavorites] = useState<boolean | undefined>(isFavoritesInit)
	const [isDownloaded, setIsDownloaded] = useState(isDownloadedInit ?? false)

	useEffect(() => {
		storage.set(MMKVStorageKeys.LibrarySortDescending, sortDescending)
		storage.set(MMKVStorageKeys.LibraryIsDownloaded, isDownloaded)

		if (isFavorites !== undefined) storage.set(MMKVStorageKeys.LibraryIsFavorites, isFavorites)
		else storage.delete(MMKVStorageKeys.LibraryIsFavorites)
	}, [sortDescending, isFavorites, isDownloaded])

	return {
		sortDescending,
		setSortDescending,
		isFavorites,
		setIsFavorites,
		isDownloaded,
		setIsDownloaded,
	}
}
const LibrarySortAndFilterContext = createContext<LibrarySortAndFilterContext>({
	sortDescending: false,
	setSortDescending: () => {},
	isFavorites: false,
	setIsFavorites: () => {},
	isDownloaded: false,
	setIsDownloaded: () => {},
})

export const LibrarySortAndFilterProvider = ({ children }: { children: React.ReactNode }) => {
	const context = LibrarySortAndFilterContextInitializer()

	return (
		<LibrarySortAndFilterContext.Provider value={context}>
			{children}
		</LibrarySortAndFilterContext.Provider>
	)
}

export const useLibrarySortAndFilterContext = () => useContext(LibrarySortAndFilterContext)
