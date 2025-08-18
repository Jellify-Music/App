import { RouteProp } from '@react-navigation/native'
import Albums from '../../components/Albums/component'
import DiscoverStackParamList, { RecentlyAddedProps } from './types'

export default function RecentlyAdded({
	route,
}: {
	route: RouteProp<DiscoverStackParamList, 'RecentlyAdded'>
}): React.JSX.Element {
	return (
		<Albums
			albums={route.params.albums}
			fetchNextPage={route.params.fetchNextPage}
			hasNextPage={route.params.hasNextPage}
			isPending={route.params.isPending}
			isFetchingNextPage={route.params.isFetchingNextPage}
			showAlphabeticalSelector={false}
		/>
	)
}
