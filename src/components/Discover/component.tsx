import React from 'react'
import { getToken, ScrollView, Separator, View } from 'tamagui'
import RecentlyAdded from './helpers/just-added'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { useDiscoverContext } from '../../providers/Discover'
import { RefreshControl } from 'react-native'
import PublicPlaylists from './helpers/public-playlists'
import SuggestedArtists from './helpers/suggested-artists'

export default function Index({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { refreshing, refresh, recentlyAdded, publicPlaylists, suggestedArtistsInfiniteQuery } =
		useDiscoverContext()

	return (
		<ScrollView
			flexGrow={1}
			contentContainerStyle={{
				flexGrow: 1,
				marginTop: getToken('$4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			paddingBottom={'$15'}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
		>
			{recentlyAdded && (
				<View testID='discover-recently-added'>
					<RecentlyAdded navigation={navigation} />
					<Separator marginVertical={'$2'} />
				</View>
			)}

			{publicPlaylists && (
				<View testID='discover-public-playlists'>
					<PublicPlaylists navigation={navigation} />
					<Separator marginVertical={'$2'} />
				</View>
			)}

			{suggestedArtistsInfiniteQuery.data && (
				<View testID='discover-suggested-artists'>
					<SuggestedArtists navigation={navigation} />
					<Separator marginVertical={'$2'} />
				</View>
			)}
		</ScrollView>
	)
}
