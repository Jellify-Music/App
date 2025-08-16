import Artists from '../../components/Artists/component'
import { SuggestedArtistsProps } from './types'

export default function SuggestedArtists({ navigation, route }: SuggestedArtistsProps) {
	return (
		<Artists
			artistsInfiniteQuery={route.params.artistsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
