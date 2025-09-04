import React from 'react'

import Tracks from '../../Tracks/component'
import { useLibrarySortAndFilterContext } from '../../../providers/Library'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import useTracks from '../../../api/queries/track'

function TracksTab(): React.JSX.Element {
	const [trackPageParams, tracksInfiniteQuery] = useTracks()

	const { isFavorites, isDownloaded } = useLibrarySortAndFilterContext()

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
