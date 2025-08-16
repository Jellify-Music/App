import { Album } from '../../components/Album'
import { AlbumProps } from '../types'
import { AlbumProvider } from '../../providers/Album'

export default function AlbumScreen({ route, navigation }: AlbumProps): React.JSX.Element {
	const { album } = route.params

	return (
		<AlbumProvider album={album}>
			<Album />
		</AlbumProvider>
	)
}
