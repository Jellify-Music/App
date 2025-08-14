import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import Playlists from '../../Playlists/component'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useLibraryContext } from '../../../providers/Library'

function PlaylistsTab(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

	const {
		playlists,
		refetchPlaylists,
		fetchNextPlaylistsPage,
		hasNextPlaylistsPage,
		isPendingPlaylists,
		isFetchingNextPlaylistsPage,
	} = useLibraryContext()

	return (
		<Playlists
			navigation={navigation}
			playlists={playlists}
			refetch={refetchPlaylists}
			fetchNextPage={fetchNextPlaylistsPage}
			hasNextPage={hasNextPlaylistsPage}
			isPending={isPendingPlaylists}
			isFetchingNextPage={isFetchingNextPlaylistsPage}
			canEdit
		/>
	)
}

export default React.memo(PlaylistsTab)
