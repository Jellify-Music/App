import { ArtistProvider } from '../../providers/Artist'
import { ArtistProps } from '../base-types'
import Artist from '../../components/Artist'

export default function ArtistScreen({ route }: ArtistProps): React.JSX.Element {
	return (
		<ArtistProvider artist={route.params.artist}>
			<Artist />
		</ArtistProvider>
	)
}
