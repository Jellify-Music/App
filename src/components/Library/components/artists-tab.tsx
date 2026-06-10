import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'
import useLibraryStore from '../../../stores/library'

function ArtistsTab(): React.JSX.Element {
	const artistsInfiniteQuery = useAlbumArtists()

	const sortDescending = useLibraryStore((state) => {
		const sd = state.sortDescending as Record<string, boolean> | boolean
		if (typeof sd === 'boolean') return sd
		return sd?.artists ?? false
	})

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			showAlphabeticalSelector
			sortDescending={sortDescending}
		/>
	)
}

export default ArtistsTab
