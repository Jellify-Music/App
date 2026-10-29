import Tracks from '../../components/Tracks/component'
import { TracksProps } from '../types'

export default function TracksScreen({ route }: TracksProps): React.JSX.Element {
	return (
		<Tracks
			showAlphabeticalSelector={route.params.showAlphabeticalSelector}
			tracksInfiniteQuery={route.params.tracksInfiniteQuery}
			queue={'Library'}
		/>
	)
}
