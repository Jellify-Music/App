import { RouteProp } from '@react-navigation/native'
import Albums from '../../components/Albums/component'
import DiscoverStackParamList, { RecentlyAddedProps } from './types'

export default function RecentlyAdded({ route }: RecentlyAddedProps): React.JSX.Element {
	return (
		<Albums
			albumsInfiniteQuery={route.params.albumsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
