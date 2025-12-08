import { BaseStackParamList } from '../types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import Playlist from '../../components/Playlist/index'

export function PlaylistScreen({
	route,
	navigation,
}: {
	route: RouteProp<BaseStackParamList, 'Playlist'>
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	return (
		<Playlist
			playlist={route.params.playlist}
			navigation={navigation}
			canEdit={route.params.canEdit}
		/>
	)
}
