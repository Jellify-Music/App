import { ScrollView, RefreshControl, Platform } from 'react-native'
import { YStack, getToken, useTheme } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import { usePreventRemove } from '@react-navigation/native'
import useHomeQueries from '../../api/mutations/home'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyPlayedTracks } from '../../api/queries/recents'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	usePreventRemove(true, () => {})

	const theme = useTheme()

	usePerformanceMonitor(COMPONENT_NAME, 5)

	const { isPending: refreshing, mutateAsync: refresh } = useHomeQueries()

	const { isPending: loadingInitialData } = useRecentlyPlayedTracks()

	const isRestoring = useIsRestoring()

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				marginVertical: getToken('$4'),
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing || isRestoring || loadingInitialData}
					onRefresh={refresh}
					tintColor={theme.primary.val}
				/>
			}
		>
			<HomeContent />
		</ScrollView>
	)
}

function HomeContent(): React.JSX.Element {
	return (
		<YStack
			alignContent='flex-start'
			gap='$3'
			marginBottom={Platform.OS === 'android' ? '$4' : undefined}
		>
			<RecentArtists />

			<RecentlyPlayed />

			<FrequentArtists />

			<FrequentlyPlayedTracks />
		</YStack>
	)
}
