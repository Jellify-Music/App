import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'
import Playlists from '../../Playlists/component'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function PlaylistsTab(): React.JSX.Element {
	const navigation = useNavigation<StackNavigationProp<StackParamList>>()

	return <Playlists navigation={navigation} />
}
