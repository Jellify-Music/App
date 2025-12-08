import { Album } from '../../components/Album'
import { AlbumProps } from '../types'

export default function AlbumScreen({ route, navigation }: AlbumProps): React.JSX.Element {
	const { album } = route.params

	return <Album album={album} />
}
