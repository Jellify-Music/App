import useAlbums from '../../../api/queries/album'
import Albums from '../../Albums/component'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

function AlbumsTab(): React.JSX.Element {
	const albumsInfiniteQuery = useAlbums()

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

	return (
		<Albums
			albumsInfiniteQuery={albumsInfiniteQuery}
			sortBy={sortBy as ItemSortBy}
			sortDescending={sortDescending}
		/>
	)
}

export default AlbumsTab
