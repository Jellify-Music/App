import React from 'react'
import { ItemList } from '../../components/Global/components/Lists/item-list'
import { useRecentlyUpdatedPlaylists } from '@/src/api/queries/playlist'

export default function RecentPlaylistsScreen(): React.JSX.Element {
	const recentlyUpdatedPlaylistsQuery = useRecentlyUpdatedPlaylists()

	return <ItemList query={recentlyUpdatedPlaylistsQuery} />
}
