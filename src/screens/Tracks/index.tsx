import Tracks from '../../components/Tracks/component'
import { TracksProps } from '../types'

export default function TracksScreen({ route, navigation }: TracksProps): React.JSX.Element {
	return (
		<Tracks
			navigation={navigation}
			tracksInfiniteQuery={route.params.tracksInfiniteQuery}
			queue={'Library'}
		/>
	)
}
