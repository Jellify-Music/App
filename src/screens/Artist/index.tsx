import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../components/types'
import { ArtistProvider } from '../../providers/Artist'
import ArtistNavigation from '../../components/Artist'

export function ArtistScreen({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'Artist'>
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { artist } = route.params

	return (
		<ArtistProvider artist={artist}>
			<ArtistNavigation navigation={navigation} />
		</ArtistProvider>
	)
}
