import { RouteProp } from '@react-navigation/native'
import { Album } from '../../components/Album'
import { StackParamList } from '../../components/types'
import { AlbumProvider } from '../../providers/Album'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export default function AlbumScreen({
	navigation,
	route,
}: {
	navigation: NativeStackNavigationProp<StackParamList, 'Album'>
	route: RouteProp<StackParamList, 'Album'>
}): React.JSX.Element {
	const { album } = route.params

	return (
		<AlbumProvider album={album}>
			<Album route={route} navigation={navigation} />
		</AlbumProvider>
	)
}
