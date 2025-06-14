import { StackParamList } from '../../components/types'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import Playlist from '../../components/Playlist/index'
import { PlaylistProvider } from '../../providers/Playlist'

export function PlaylistScreen({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'Playlist'>
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
	return (
		<PlaylistProvider playlist={route.params.playlist}>
			<Playlist playlist={route.params.playlist} navigation={navigation} />
		</PlaylistProvider>
	)
}
