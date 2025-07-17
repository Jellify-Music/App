import Playlists from '../../components/Playlists/component'
import { PublicPlaylistsProps } from '../../components/types'

export default function PublicPlaylists({
	navigation,
	route,
}: PublicPlaylistsProps): React.JSX.Element {
	return (
		<Playlists
			navigation={navigation}
			playlists={route.params.playlists}
			fetchNextPage={route.params.fetchNextPage}
			hasNextPage={route.params.hasNextPage}
			isPending={route.params.isPending}
			isFetchingNextPage={route.params.isFetchingNextPage}
			refetch={route.params.refetch}
		/>
	)
}
