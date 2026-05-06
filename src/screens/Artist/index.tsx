import { ArtistProvider } from '../../providers/Artist'
import { RouteProp } from '@react-navigation/native'
import { BaseStackParamList } from '../types'
import ArtistOverviewTab from '../../components/Artist/OverviewTab'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	return (
		<ArtistProvider artist={route.params.artist}>
			<ArtistOverviewTab />
		</ArtistProvider>
	)
}
