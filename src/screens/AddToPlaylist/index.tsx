import AddToPlaylist from '../../components/AddToPlaylist/index'
import { AddToPlaylistProps } from '../types'

export default function AddToPlaylistSheet({ route }: AddToPlaylistProps): React.JSX.Element {
	return (
		<AddToPlaylist
			track={route.params.track}
			tracks={route.params.tracks}
			source={route.params.source}
		/>
	)
}
