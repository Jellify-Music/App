import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import { MostPlayedTracksProps, RecentTracksProps } from './types'
import { useFrequentlyPlayedTracks } from '../../api/queries/frequents'
import InfiniteItemList from '../../components/Global/components/Lists/item-list'

export default function HomeTracksScreen({
	route,
}: RecentTracksProps | MostPlayedTracksProps): React.JSX.Element {
	const recentlyPlayedTracks = useRecentlyPlayedTracks()

	const frequentlyPlayedTracks = useFrequentlyPlayedTracks()

	if (route.name === 'MostPlayedTracks') {
		return <InfiniteItemList infiniteQuery={frequentlyPlayedTracks} queue={'On Repeat'} />
	}

	return <InfiniteItemList infiniteQuery={recentlyPlayedTracks} queue={'Recently Played'} />
}
