import { PlaylistProps } from '../base-types'
import React from 'react'
import Playlist from '../../components/Playlist/index'

export function PlaylistScreen(props: PlaylistProps): React.JSX.Element {
	return <Playlist {...props} />
}
