import { BaseStackParamList } from '../types'
import { RouteProp } from '@react-navigation/native'
import React from 'react'
import Playlist from '../../components/Playlist/index'
import { PlaylistProvider } from '../../providers/Playlist'

export function PlaylistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Playlist'>
}): React.JSX.Element {
	return (
		<PlaylistProvider playlist={route.params.playlist} canEdit={route.params.canEdit}>
			<Playlist />
		</PlaylistProvider>
	)
}
