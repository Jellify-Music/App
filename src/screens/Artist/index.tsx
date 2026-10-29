import { ArtistProvider } from '../../providers/Artist'
import { RouteProp } from '@react-navigation/native'
import { BaseStackParamList } from '../types'
import Artist from '../../components/Artist'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	return (
		<ArtistProvider artist={route.params.artist}>
			<Artist />
		</ArtistProvider>
	)
}
