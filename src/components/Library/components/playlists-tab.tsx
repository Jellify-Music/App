import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import Playlists from '../../Playlists/component'
import React from 'react'
import { useNavigation } from '@react-navigation/native'

export default function PlaylistsTab(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

	return <Playlists navigation={navigation} />
}
