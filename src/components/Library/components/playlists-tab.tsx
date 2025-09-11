import { useUserPlaylists } from '../../../api/queries/playlist'
import Playlists from '../../Playlists/component'
import React from 'react'

function PlaylistsTab(): React.JSX.Element {
	const playlistsInfiniteQuery = useUserPlaylists()

	return (
		<Playlists
			playlists={playlistsInfiniteQuery.data}
			refetch={playlistsInfiniteQuery.refetch}
			fetchNextPage={playlistsInfiniteQuery.fetchNextPage}
			hasNextPage={playlistsInfiniteQuery.hasNextPage}
			isPending={playlistsInfiniteQuery.isPending}
			isFetchingNextPage={playlistsInfiniteQuery.isFetchingNextPage}
			canEdit
		/>
	)
}

export default PlaylistsTab
