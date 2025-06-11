import { useNavigation } from '@react-navigation/native'
import Artists from '../../Artists/component'
import { useLibraryContext } from '../../../providers/Library'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../types'

export default function ArtistsTab(): React.JSX.Element {
	const {
		artists,
		isPendingArtists,
		fetchNextArtistsPage,
		hasNextArtistsPage,
		isFetchingNextArtistsPage,
	} = useLibraryContext()

	const navigation = useNavigation<StackNavigationProp<StackParamList>>()

	return (
		<Artists
			artists={artists}
			isPending={isPendingArtists}
			navigation={navigation}
			fetchNextPage={fetchNextArtistsPage}
			hasNextPage={hasNextArtistsPage}
			isFetchingNextPage={isFetchingNextArtistsPage}
			showAlphabeticalSelector={true}
		/>
	)
}
