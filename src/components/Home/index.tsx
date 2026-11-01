import { ScrollView, RefreshControl } from 'react-native'
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
import { useIsHolidays } from '../Holidays/hooks'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	const theme = useTheme()

	usePreventRemove(true, () => {})

	usePerformanceMonitor(COMPONENT_NAME, 5)

	const { isPending: refreshing, mutateAsync: refresh } = useHomeQueries()

	const { isPending: loadingInitialData } = useRecentlyPlayedTracks()

	const isRestoring = useIsRestoring()

	const isHolidays = useIsHolidays()

	const onRefresh = async () => {
		await refresh()
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				paddingVertical: getToken('2'),
				// Holidays: the design starts its first heading 5px higher
				...(isHolidays && { paddingTop: Math.max(getToken('2') - 5, 0) }),
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing || loadingInitialData || isRestoring}
					onRefresh={onRefresh}
					tintColor={theme.primary.val}
				/>
			}
		>
			<HomeContent isHolidays={isHolidays} />
		</ScrollView>
	)
}

function HomeContent({ isHolidays }: { isHolidays: boolean }): React.JSX.Element {
	return (
		// Holidays: sections sit 215px apart in the design, 12px more than the stock spacing
		<YStack alignContent='flex-start' gap={isHolidays ? getToken('3') + 18 : '3'}>
			<RecentArtists />

			<RecentlyPlayed />

			<FrequentArtists />

			<FrequentlyPlayedTracks />
		</YStack>
	)
}
