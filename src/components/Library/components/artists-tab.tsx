import { useAlbumArtists } from '../../../api/queries/artist'
import Artists from '../../Artists/component'

function ArtistsTab(): React.JSX.Element {
	const [artistPageParams, artistsInfiniteQuery] = useAlbumArtists()

	return (
		<Artists
			artistsInfiniteQuery={artistsInfiniteQuery}
			showAlphabeticalSelector={true}
			artistPageParams={artistPageParams}
		/>
	)
}

export default ArtistsTab
