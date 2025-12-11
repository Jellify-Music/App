import React from 'react'

import Tracks from '../../Tracks/component'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import useTracks from '../../../api/queries/track'
import useLibraryStore from '../../../stores/library'

function TracksTab(): React.JSX.Element {
	const [trackPageParams, tracksInfiniteQuery] = useTracks()

	const { isFavorites, isDownloaded } = useLibraryStore()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	return (
		<Tracks
			navigation={navigation}
			tracksInfiniteQuery={tracksInfiniteQuery}
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
			showAlphabeticalSelector={true}
			trackPageParams={trackPageParams}
		/>
	)
}

export default TracksTab
