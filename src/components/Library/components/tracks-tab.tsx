import React from 'react'

import Tracks from '../../Tracks/component'
import { useTracksInfiniteQueryContext } from '../../../providers/Library'
import { useLibrarySortAndFilterContext } from '../../../providers/Library/sorting-filtering'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

function TracksTab(): React.JSX.Element {
	const tracksInfiniteQuery = useTracksInfiniteQueryContext()

	const { isFavorites, isDownloaded } = useLibrarySortAndFilterContext()

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	return (
		<Tracks
			navigation={navigation}
			tracks={tracksInfiniteQuery.data}
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
			filterDownloaded={isDownloaded}
			filterFavorites={isFavorites}
			fetchNextPage={tracksInfiniteQuery.fetchNextPage}
			hasNextPage={tracksInfiniteQuery.hasNextPage}
		/>
	)
}

export default TracksTab
