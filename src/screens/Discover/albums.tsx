import ItemList from '../../components/Global/components/item-list'
import { useDiscoverAlbums } from '../../api/queries/suggestions'
import { DiscoverAlbumScreenType, DiscoverAlbumsProps } from './types'
import { useRecentlyAddedAlbums } from '../../api/queries/album'

export default function DiscoverAlbums({ route }: DiscoverAlbumsProps): React.JSX.Element {
	const suggestedAlbumsQuery = useDiscoverAlbums()
	const recentlyAddedAlbumsQuery = useRecentlyAddedAlbums()

	const query =
		route.params.type === DiscoverAlbumScreenType.RecentlyAdded
			? recentlyAddedAlbumsQuery
			: suggestedAlbumsQuery

	return <ItemList query={query} />
}
