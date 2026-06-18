import ItemList from '../../components/Global/components/item-list'
import { useDiscoverAlbums } from '../../api/queries/suggestions'
import { DiscoverAlbumsProps } from './types'

export default function DiscoverAlbums({ route }: DiscoverAlbumsProps): React.JSX.Element {
	const query = useDiscoverAlbums()

	return <ItemList query={query} />
}
