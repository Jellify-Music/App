import useAlbums from '../../../api/queries/album'
import Albums from '../../Albums/component'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

function AlbumsTab(): React.JSX.Element {
	const [albumPageParams, albumsInfiniteQuery] = useAlbums()

	const sortBy = useLibraryStore((state) => {
		const sb = state.sortBy as Record<string, string> | string
		if (typeof sb === 'string') return sb
		return sb?.albums ?? ItemSortBy.Album
	})
	const sortDescending = useLibraryStore((state) => {
		const sd = state.sortDescending as Record<string, boolean> | boolean
		if (typeof sd === 'boolean') return sd
		return sd?.albums ?? false
	})
	const hasLetterSections =
		albumsInfiniteQuery.data?.some((item) => typeof item === 'string') ?? false
	const showAlphabeticalSelector =
		hasLetterSections ||
		sortBy === ItemSortBy.Name ||
		sortBy === ItemSortBy.SortName ||
		sortBy === ItemSortBy.Album ||
		sortBy === ItemSortBy.Artist

	return (
		<Albums
			albumsInfiniteQuery={albumsInfiniteQuery}
			showAlphabeticalSelector={showAlphabeticalSelector}
			sortBy={sortBy as ItemSortBy}
			sortDescending={sortDescending}
			albumPageParams={albumPageParams}
		/>
	)
}

export default AlbumsTab
