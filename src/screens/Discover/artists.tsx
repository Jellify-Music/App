import Artists from '../../components/Artists/component'
import { SuggestedArtistsProps } from '../../components/types'

export default function SuggestedArtists({ navigation, route }: SuggestedArtistsProps) {
	return (
		<Artists
			navigation={navigation}
			artistsInfiniteQuery={route.params.artistsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
