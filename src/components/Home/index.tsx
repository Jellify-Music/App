import { ScrollView, Platform, RefreshControl } from 'react-native'
import { YStack, getToken, useTheme } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import NavidromeHomeContent from './helpers/navidrome-content'
import { usePreventRemove } from '@react-navigation/native'
import useHomeQueries from '../../api/mutations/home'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import { useJellifyServer } from '../../stores'
import { useNavidromeHomeContent } from '../../hooks/adapter'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	const theme = useTheme()
	const [server] = useJellifyServer()
	const isNavidrome = server?.backend === 'navidrome'

	usePreventRemove(true, () => {})

	usePerformanceMonitor(COMPONENT_NAME, 5)

	// Use different refresh logic based on backend
	const jellyfinHomeQueries = useHomeQueries()
	const navidromeHomeContent = useNavidromeHomeContent()

	const { isPending: loadingJellyfinData } = useRecentlyPlayedTracks()

	const isRestoring = useIsRestoring()

	const refreshing = isNavidrome
		? navidromeHomeContent.isPending
		: jellyfinHomeQueries.isPending || loadingJellyfinData

	const handleRefresh = async () => {
		if (isNavidrome) {
			await navidromeHomeContent.refetchAll()
		} else {
			await jellyfinHomeQueries.mutateAsync()
		}
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				marginVertical: getToken('$4'),
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing || isRestoring}
					onRefresh={handleRefresh}
					tintColor={theme.primary.val}
				/>
			}
		>
			{isNavidrome ? <NavidromeHomeContent /> : <JellyfinHomeContent />}
		</ScrollView>
	)
}

function JellyfinHomeContent(): React.JSX.Element {
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
