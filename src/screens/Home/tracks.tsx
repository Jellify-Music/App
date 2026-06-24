import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import Tracks from '../../components/Tracks/component'
import { MostPlayedTracksProps, RecentTracksProps } from './types'
import { useFrequentlyPlayedTracks } from '../../api/queries/frequents'
import { HomeNavigator, useNavigation } from '@react-navigation/native'
import ItemList from '../../components/Global/components/item-list'

export default function HomeTracksScreen({
	route,
}: RecentTracksProps | MostPlayedTracksProps): React.JSX.Element {
	const navigation = useNavigation<HomeNavigator>()

	const recentlyPlayedTracks = useRecentlyPlayedTracks()

	const frequentlyPlayedTracks = useFrequentlyPlayedTracks()

	if (navigation.getState().routeNames.pop() === 'MostPlayedTracks') {
		return <Tracks tracksInfiniteQuery={frequentlyPlayedTracks} queue={'On Repeat'} />
	}

	return <ItemList query={recentlyPlayedTracks} queue={'Recently Played'} />
}
