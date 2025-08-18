import { ScrollView, RefreshControl } from 'react-native'
import { YStack, Separator, getToken } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import { useHomeContext } from '../../providers/Home'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import { usePreventRemove } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function ProvidedHome(): React.JSX.Element {
	usePreventRemove(true, () => {})
	const { refreshing: refetching, onRefresh } = useHomeContext()

	return (
		<SafeAreaView style={{ flex: 1 }} edges={['top']}>
			<ScrollView
				contentInsetAdjustmentBehavior='automatic'
				contentContainerStyle={{
					marginVertical: getToken('$4'),
				}}
				refreshControl={<RefreshControl refreshing={refetching} onRefresh={onRefresh} />}
				removeClippedSubviews // Save memory usage
			>
				<YStack alignContent='flex-start'>
					<RecentArtists />

					<Separator marginVertical={'$3'} />

					<RecentlyPlayed />

					<Separator marginVertical={'$3'} />

					<FrequentArtists />

					<Separator marginVertical={'$3'} />

					<FrequentlyPlayedTracks />
				</YStack>
			</ScrollView>
		</SafeAreaView>
	)
}
