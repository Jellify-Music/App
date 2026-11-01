import { usePublicPlaylists } from '../../api/queries/playlist'
import Playlists from '../../components/Playlists/component'

export default function PublicPlaylists(): React.JSX.Element {
	const query = usePublicPlaylists()

	return <Playlists query={query} />
}
