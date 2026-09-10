import ItemList from '../../components/Global/components/Item/item-list'
import { useDiscoverArtists } from '../../api/queries/suggestions'
import { SuggestedArtistsProps } from './types'

export default function SuggestedArtists({ route }: SuggestedArtistsProps) {
	const query = useDiscoverArtists()

	return <ItemList query={query} />
}
