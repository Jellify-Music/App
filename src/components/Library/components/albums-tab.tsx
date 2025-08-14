import Albums from '../../Albums/component'
import { useAlbumsInfiniteQueryContext } from '../../../providers/Library'

export default function AlbumsTab(): React.JSX.Element {
	const albumsInfiniteQuery = useAlbumsInfiniteQueryContext()

	return (
		<Albums
			albums={albumsInfiniteQuery.data}
			fetchNextPage={albumsInfiniteQuery.fetchNextPage}
			hasNextPage={albumsInfiniteQuery.hasNextPage}
			isPending={albumsInfiniteQuery.isPending}
			isFetchingNextPage={albumsInfiniteQuery.isFetchingNextPage}
			showAlphabeticalSelector={true}
		/>
	)
}
