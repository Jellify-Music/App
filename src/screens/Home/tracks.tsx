import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import Tracks from '../../components/Tracks/component'
import HomeStackParamList, { MostPlayedTracksProps, RecentTracksProps } from './types'
import { useFrequentlyPlayedTracks } from '../../api/queries/frequents'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemList from '../../components/Global/components/item-list'

export default function HomeTracksScreen({
	route,
}: RecentTracksProps | MostPlayedTracksProps): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const recentlyPlayedTracks = useRecentlyPlayedTracks()

	const frequentlyPlayedTracks = useFrequentlyPlayedTracks()

	if (route.name === 'MostPlayedTracks') {
		return <ItemList query={frequentlyPlayedTracks} queue={'On Repeat'} />
	}

	return <ItemList query={recentlyPlayedTracks} queue={'Recently Played'} />
}
