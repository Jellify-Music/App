import { ScrollView, Platform, RefreshControl } from 'react-native'
import { YStack, getToken, useTheme } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import RecentlyAddedAlbums from './helpers/recently-added-albums'
import { usePreventRemove } from '@react-navigation/native'
import useHomeQueries from '../../api/mutations/home'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyPlayedTracks } from '../../api/queries/recents'
import { useAdapter } from '../../stores'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	const theme = useTheme()
	const adapter = useAdapter()

	usePreventRemove(true, () => {})

	usePerformanceMonitor(COMPONENT_NAME, 5)

	// Unified refresh logic using homeQueries
	const homeQueries = useHomeQueries()
	const { isPending: loadingData } = useRecentlyPlayedTracks()

	const isRestoring = useIsRestoring()

	const refreshing = homeQueries.isPending || loadingData

	const handleRefresh = async () => {
		await homeQueries.mutateAsync()
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
			<UnifiedHomeContent />
		</ScrollView>
	)
}

/**
 * Unified home content component.
 * Renders all sections - each section conditionally shows based on data availability.
 * For Jellyfin: artist/track sections will have data
 * For Navidrome: album sections will have data
 * Some may have data for both backends if the adapter supports it.
 */
function UnifiedHomeContent(): React.JSX.Element {
	return (
		<YStack
			alignContent='flex-start'
			gap='$3'
			marginBottom={Platform.OS === 'android' ? '$4' : undefined}
		>
			{/* Artist sections - work for both backends via adapter */}
			<RecentArtists />
			<FrequentArtists />

			{/* Track sections - work for both backends via adapter */}
			<RecentlyPlayed />
			<FrequentlyPlayedTracks />

			{/* Album section - shows recently added albums (works for both) */}
			<RecentlyAddedAlbums />
		</YStack>
	)
}
