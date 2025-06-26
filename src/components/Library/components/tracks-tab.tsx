import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useNavigation } from '@react-navigation/native'
import { StackParamList } from '../../types'
import Tracks from '../../Tracks/component'
import { useLibraryContext } from '../../../providers/Library'
import { useLibrarySortAndFilterContext } from '../../../providers/Library/sorting-filtering'

export default function TracksTab(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

	const { tracks, fetchNextTracksPage, hasNextTracksPage } = useLibraryContext()

	const { isFavorites, isDownloaded } = useLibrarySortAndFilterContext()

	return (
		<Tracks
			navigation={navigation}
			tracks={tracks}
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
			filterDownloaded={isDownloaded}
			filterFavorites={isFavorites}
			fetchNextPage={fetchNextTracksPage}
			hasNextPage={hasNextTracksPage}
		/>
	)
}
