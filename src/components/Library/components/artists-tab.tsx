import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import useArtistLibraryStore from '../../../stores/library/artist'

function ArtistsTab(): React.JSX.Element {
	const { sortBy, sortDescending, setPendingLetter } = useArtistLibraryStore()

	const artistsInfiniteQuery = useAlbumArtists()

	// Artists tab only sorts by name, so always show A-Z when we have letter sections
	const showAlphabeticalSelector = sortBy === ItemSortBy.Name || sortBy === ItemSortBy.SortName

	const onLetterSelect = async (letter: string) => {
		setPendingLetter(letter)
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
