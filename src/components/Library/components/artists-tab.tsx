import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'

function ArtistsTab(): React.JSX.Element {
	const { isFavorites, sortDescending } = useLibrarySortAndFilterContext()

	const [artistPageParams, artistsInfiniteQuery] = useAlbumArtists({
		isFavorites,
		sortDescending,
	})

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			showAlphabeticalSelector={true}
			artistPageParams={artistPageParams}
		/>
	)
}

export default ArtistsTab
