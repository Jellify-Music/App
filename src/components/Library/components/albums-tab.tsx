import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Albums from '../../Albums/component'
import { StackParamList } from '../../types'
import { useLibraryContext } from '../../../providers/Library'
import { useNavigation } from '@react-navigation/native'

export default function AlbumsTab(): React.JSX.Element {
	const { albums, fetchNextAlbumsPage, hasNextAlbumsPage } = useLibraryContext()

	const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

	return (
		<Albums
			albums={albums}
			navigation={navigation}
			fetchNextPage={fetchNextAlbumsPage}
			hasNextPage={hasNextAlbumsPage}
		/>
	)
}
