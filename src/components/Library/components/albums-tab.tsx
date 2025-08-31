import useAlbums from '../../../api/queries/album'
import Albums from '../../Albums/component'

function AlbumsTab(): React.JSX.Element {
	const [albumPageParams, albumsInfiniteQuery] = useAlbums()

	return (
		<Albums
			albumsInfiniteQuery={albumsInfiniteQuery}
			showAlphabeticalSelector={true}
			albumPageParams={albumPageParams}
		/>
	)
}

export default AlbumsTab
