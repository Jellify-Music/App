import InfiniteItemList from '../../components/Global/components/Lists/item-list'
import { useDiscoverArtists } from '../../api/queries/suggestions'
import { SuggestedArtistsProps } from './types'

export default function SuggestedArtists({ route }: SuggestedArtistsProps) {
	const query = useDiscoverArtists()

	return <InfiniteItemList infiniteQuery={query} />
}
