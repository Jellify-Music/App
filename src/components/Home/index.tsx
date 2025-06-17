import { StackParamList } from '../types'
import { ScrollView, RefreshControl } from 'react-native'
import { YStack, Separator, getTokens } from 'tamagui'
import RecentArtists from './helpers/recent-artists'
import RecentlyPlayed from './helpers/recently-played'
import { useHomeContext } from '../../providers/Home'
import { H5 } from '../Global/helpers/text'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import FrequentArtists from './helpers/frequent-artists'
import FrequentlyPlayedTracks from './helpers/frequent-tracks'
import DownloadedTracks from './helpers/downloaded-tracks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useJellifyContext } from '../../providers'

export function ProvidedHome({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { user } = useJellifyContext()
	const { refreshing: refetching, onRefresh } = useHomeContext()
	const insets = useSafeAreaInsets()

	return (
		<ScrollView
			contentInsetAdjustmentBehavior='automatic'
			contentContainerStyle={{
				marginVertical: 16,
			}}
			refreshControl={<RefreshControl refreshing={refetching} onRefresh={onRefresh} />}
			removeClippedSubviews // Save memory usage
		>
			<YStack alignContent='flex-start'>
				<H5 marginHorizontal={'$2'}>{`Hi, ${user?.name ?? ''}`}</H5>

				<Separator marginVertical={'$3'} />

				<DownloadedTracks navigation={navigation} />

				<Separator marginVertical={'$3'} />

				<RecentArtists navigation={navigation} />

				<Separator marginVertical={'$3'} />

				<RecentlyPlayed navigation={navigation} />

				<Separator marginVertical={'$3'} />

				<FrequentArtists navigation={navigation} />

				<Separator marginVertical={'$3'} />

				<FrequentlyPlayedTracks navigation={navigation} />
			</YStack>
		</ScrollView>
	)
}
