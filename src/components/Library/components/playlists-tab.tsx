import { useUserPlaylists } from '../../../api/queries/playlist'
import Playlists from '../../Playlists/component'
import React from 'react'

function PlaylistsTab(): React.JSX.Element {
	const result = useUserPlaylists()

	return <Playlists query={result} />
}

export default PlaylistsTab
