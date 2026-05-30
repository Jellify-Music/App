import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { useRef } from 'react'

function ArtistsTab(): React.JSX.Element {
	const pendingLetterRef = useRef<string | null>(null)

	const artistsInfiniteQuery = useAlbumArtists(pendingLetterRef)

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
	const hasLetterSections =
		artistsInfiniteQuery.data?.some((item) => typeof item === 'string') ?? false
	// Artists tab only sorts by name, so always show A-Z when we have letter sections
	const showAlphabeticalSelector =
		hasLetterSections ||
		sortBy === ItemSortBy.Name ||
		sortBy === ItemSortBy.SortName ||
		sortBy === ItemSortBy.Artist

	const onLetterSelect = (letter: string) => {
		pendingLetterRef.current = letter
	}

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			showAlphabeticalSelector={showAlphabeticalSelector}
			sortDescending={sortDescending}
			onLetterSelect={onLetterSelect}
		/>
	)
}

export default ArtistsTab
