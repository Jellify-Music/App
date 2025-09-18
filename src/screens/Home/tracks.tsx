import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import Tracks from '../../components/Tracks/component'
import { MostPlayedTracksProps, RecentTracksProps } from './types'
import { useFrequentlyPlayedTracks } from '../../api/queries/frequents'

export default function HomeTracksScreen({
	navigation,
	route,
}: RecentTracksProps | MostPlayedTracksProps): React.JSX.Element {
	const recentlyPlayedTracks = useRecentlyPlayedTracks()

	const frequentlyPlayedTracks = useFrequentlyPlayedTracks()

	if (route.name === 'MostPlayedTracks') {
		return (
			<Tracks
				navigation={navigation}
				tracksInfiniteQuery={frequentlyPlayedTracks}
				queue={'On Repeat'}
			/>
		)
	}

	return (
		<Tracks
			navigation={navigation}
			tracksInfiniteQuery={recentlyPlayedTracks}
			queue={'Recently Played'}
		/>
	)
}
