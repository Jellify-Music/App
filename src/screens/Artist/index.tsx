import { ArtistProvider } from '../../providers/Artist'
import { ArtistProps } from '../types'
import ArtistOverviewTab from '../../components/Artist/OverviewTab'

export default function ArtistScreen({ route }: ArtistProps): React.JSX.Element {
	return (
		<ArtistProvider artist={route.params.artist}>
			<ArtistOverviewTab />
		</ArtistProvider>
	)
}
