import { ScrollView, RefreshControl } from 'react-native'
import { YStack, getToken } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import { usePreventRemove } from '@react-navigation/native'
import useHomeQueries from '../../api/queries/home'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	usePreventRemove(true, () => {})

	usePerformanceMonitor(COMPONENT_NAME, 5)

	const { data, isFetching: refreshing, refetch: refresh } = useHomeQueries()

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				marginVertical: getToken('$4'),
				marginHorizontal: getToken('$2'),
			}}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
		>
			<YStack alignContent='flex-start' gap='$3'>
				<RecentArtists />

				<RecentlyPlayed />

				<FrequentArtists />

				<FrequentlyPlayedTracks />
			</YStack>
		</ScrollView>
	)
}
