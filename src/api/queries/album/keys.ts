import { JellifyLibrary } from '@/src/types/JellifyLibrary'

enum AlbumQueryKeys {
	RecentlyAdded = 'RECENTLY_ADDED',
	OnThisDay = 'ON_THIS_DAY',
	InfiniteAlbums = 'INFINITE_ALBUMS',
}

/**
 * A query key for an infinite query of albums
 *
 * @param isFavorites Whether the albums are filtered to favorites
 * @param library The {@link JellifyLibrary} set in the store
 * @returns
 */
export const InfiniteAlbumsQueryKey = (
	isFavorites: boolean | undefined,
	library: JellifyLibrary | undefined,
) => [AlbumQueryKeys.InfiniteAlbums, isFavorites, library?.musicLibraryId]

/**
 * A query key for an infinite query of recent albums
 *
 * @param library The {@link JellifyLibrary} set in the store
 * @returns
 */
export const RecentlyAddedAlbumsQueryKey = (library: JellifyLibrary | undefined) => [
	AlbumQueryKeys.RecentlyAdded,
	library?.musicLibraryId,
]

/**
 * A query key for an infinite query of albums released on this day
 *
 * @param library The {@link JellifyLibrary} set in the store
 * @returns
 */
export const AlbumsOnthisDayQueryKey = (library: JellifyLibrary | undefined) => {
	const date = new Date()

	return [AlbumQueryKeys.OnThisDay, library?.musicLibraryId, date.getMonth(), date.getDay()]
}
