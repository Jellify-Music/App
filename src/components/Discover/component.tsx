import React from 'react'
import { getToken, ScrollView, Separator, View, YStack } from 'tamagui'
import RecentlyAdded from './helpers/just-added'
import { useDiscoverContext } from '../../providers/Discover'
import { RefreshControl } from 'react-native'
import PublicPlaylists from './helpers/public-playlists'
import SuggestedArtists from './helpers/suggested-artists'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index(): React.JSX.Element {
	const { refreshing, refresh, publicPlaylists, suggestedArtistsInfiniteQuery } =
		useDiscoverContext()

	return (
		<ScrollView
			contentContainerStyle={{
				flexGrow: 1,
				marginTop: getToken('$4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			paddingBottom={'$15'}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
		>
			<YStack gap={'$3'}>
				<View testID='discover-recently-added'>
					<RecentlyAdded />
				</View>

				{publicPlaylists && (
					<View testID='discover-public-playlists'>
						<PublicPlaylists />
					</View>
				)}

				{suggestedArtistsInfiniteQuery.data && (
					<View testID='discover-suggested-artists'>
						<SuggestedArtists />
					</View>
				)}
			</YStack>
		</ScrollView>
	)
}
