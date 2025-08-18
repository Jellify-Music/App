import Playlists from '../../Playlists/component'
import React from 'react'
import { usePlaylistsInfiniteQueryContext } from '../../../providers/Library'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import DiscoverStackParamList from '@/src/screens/Discover/types'

function PlaylistsTab(): React.JSX.Element {
	const playlistsInfiniteQuery = usePlaylistsInfiniteQueryContext()

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
