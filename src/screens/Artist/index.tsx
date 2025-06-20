import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { StackParamList } from '../../components/types'
import { ArtistProvider } from '../../providers/Artist'
import ArtistNavigation from '../../components/Artist'

export function ArtistScreen({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'Artist'>
	navigation: StackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { artist } = route.params

	return (
		<ArtistProvider artist={artist}>
			<ArtistNavigation navigation={navigation} />
		</ArtistProvider>
	)
}
