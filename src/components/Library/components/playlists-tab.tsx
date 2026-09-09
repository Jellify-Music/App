import { useUserPlaylists } from '../../../api/queries/playlist'
import Playlists from '../../Playlists/component'
import React from 'react'

function PlaylistsTab(): React.JSX.Element {
	const {
		data: playlists,
		refetch,
		fetchNextPage,
		hasNextPage,
		isPending,
		isFetchingNextPage,
	} = useUserPlaylists()

	return (
		<Playlists
			playlists={playlists}
			refetch={refetch}
			fetchNextPage={fetchNextPage}
			hasNextPage={hasNextPage}
			isPending={isPending}
			isFetchingNextPage={isFetchingNextPage}
		/>
	)
}

export default PlaylistsTab
