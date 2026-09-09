import { usePublicPlaylists } from '../../api/queries/playlist'
import Playlists from '../../components/Playlists/component'

export default function PublicPlaylists(): React.JSX.Element {
	const {
		data: playlists,
		fetchNextPage,
		hasNextPage,
		isPending,
		isFetchingNextPage,
		refetch,
	} = usePublicPlaylists()

	return (
		<Playlists
			playlists={playlists}
			fetchNextPage={fetchNextPage}
			hasNextPage={hasNextPage}
			isPending={isPending}
			isFetchingNextPage={isFetchingNextPage}
			refetch={refetch}
		/>
	)
}
