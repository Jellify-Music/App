import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import Tracks from '../../components/Tracks/component'
import { HomeStackNavigator, MostPlayedTracksProps, RecentTracksProps } from './types'
import { useFrequentlyPlayedTracks } from '../../api/queries/frequents'
import { useNavigation } from '@react-navigation/native'
import InfiniteItemList from '../../components/Global/components/Lists/item-list'

export default function HomeTracksScreen({
	route,
}: RecentTracksProps | MostPlayedTracksProps): React.JSX.Element {
	const navigation = useNavigation<HomeStackNavigator>()

	const recentlyPlayedTracks = useRecentlyPlayedTracks()

	const frequentlyPlayedTracks = useFrequentlyPlayedTracks()

	if (navigation.getState().routeNames.pop() === 'MostPlayedTracks') {
		return <Tracks tracksInfiniteQuery={frequentlyPlayedTracks} queue={'On Repeat'} />
	}

	return <InfiniteItemList infiniteQuery={recentlyPlayedTracks} queue={'Recently Played'} />
}
