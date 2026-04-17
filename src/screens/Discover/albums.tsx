import Albums from '../../components/Albums/component'
import { DiscoverAlbumsProps } from './types'

export default function DiscoverAlbums({ route }: DiscoverAlbumsProps): React.JSX.Element {
	return (
		<Albums
			albumsInfiniteQuery={route.params.albumsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
