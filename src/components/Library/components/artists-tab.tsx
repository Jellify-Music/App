import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

function ArtistsTab(): React.JSX.Element {
	const artistsInfiniteQuery = useAlbumArtists()

	const sortBy = useLibraryStore((state) => {
		const sb = state.sortBy as Record<string, string> | string
		if (typeof sb === 'string') return sb
		return sb?.artists ?? ItemSortBy.SortName
	})
	const sortDescending = useLibraryStore((state) => {
		const sd = state.sortDescending as Record<string, boolean> | boolean
		if (typeof sd === 'boolean') return sd
		return sd?.artists ?? false
	})
	// Artists tab only sorts by name, so always show A-Z when we have letter sections
	const showAlphabeticalSelector = sortBy === ItemSortBy.Name || sortBy === ItemSortBy.SortName

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			showAlphabeticalSelector={showAlphabeticalSelector}
			sortDescending={sortDescending}
		/>
	)
}

export default ArtistsTab
