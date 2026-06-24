import { PlaylistProps } from '../base-types'
import React from 'react'
import Playlist from '../../components/Playlist/index'
import { PlaylistProvider } from '../../providers/Playlist'

export function PlaylistScreen({ route }: PlaylistProps): React.JSX.Element {
	return (
		<PlaylistProvider playlist={route.params.playlist} canEdit={route.params.canEdit}>
			<Playlist route={route} />
		</PlaylistProvider>
	)
}
