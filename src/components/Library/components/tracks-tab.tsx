import LetterAnchoredTracks from '../../Tracks/letter-anchored'
import useLibraryStore from '../../../stores/library'

function TracksTab(): React.JSX.Element {
	const { filters } = useLibraryStore()
	const { isFavorites, isDownloaded } = filters.tracks

	return (
		<LetterAnchoredTracks
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
		/>
	)
}

export default TracksTab
