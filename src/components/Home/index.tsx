import { ScrollView, Platform, RefreshControl } from 'react-native'
import { YStack, getToken, useTheme, XStack } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import { usePreventRemove, useNavigation } from '@react-navigation/native'
import { useLayoutEffect } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HomeStackParamList from '../../screens/Home/types'
import Icon from '../Global/components/icon'
import {
	useShowRecentArtistsSetting,
	useShowRecentlyPlayedSetting,
	useShowFrequentArtistsSetting,
	useShowFrequentlyPlayedTracksSetting,
} from '../../stores/settings/app'
import useHomeQueries from '../../api/mutations/home'
import { usePerformanceMonitor } from '../../hooks/use-performance-monitor'
import { useIsRestoring } from '@tanstack/react-query'
import { useRecentlyPlayedTracks } from '../../api/queries/recents'

const COMPONENT_NAME = 'Home'

export function Home(): React.JSX.Element {
	const theme = useTheme()

	usePreventRemove(true, () => {})

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<Icon
					name={'cogs'}
					color={'$primary'}
					onPress={() => navigation.getParent()?.navigate('SettingsTab')}
				/>
			),
			headerRight: () => (
				<XStack gap={'$2'}>
					<Icon
						name={'pencil'}
						color={'$primary'}
						onPress={() => navigation.navigate('HomeCustomize')}
					/>
				</XStack>
			),
		})
	}, [navigation])

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
					refreshing={refreshing || loadingInitialData || isRestoring}
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
	const [showRecentArtists] = useShowRecentArtistsSetting()
	const [showRecentlyPlayed] = useShowRecentlyPlayedSetting()
	const [showFrequentArtists] = useShowFrequentArtistsSetting()
	const [showFrequentlyPlayedTracks] = useShowFrequentlyPlayedTracksSetting()

	return (
		<YStack
			alignContent='flex-start'
			gap='$3'
			marginBottom={Platform.OS === 'android' ? '$4' : undefined}
		>
			{showRecentArtists && <RecentArtists />}

			{showRecentlyPlayed && <RecentlyPlayed />}

			{showFrequentArtists && <FrequentArtists />}

			{showFrequentlyPlayedTracks && <FrequentlyPlayedTracks />}
		</YStack>
	)
}
