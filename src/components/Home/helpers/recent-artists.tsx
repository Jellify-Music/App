import React from 'react'
import { H5, View, XStack } from 'tamagui'
import { RootStackParamList } from '../../../screens/types'
import { ItemCard } from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { useRecentArtists } from '../../../api/queries/recents'
import { pickFirstGenre } from '../../../utils/genre-formatting'

export default function RecentArtists(): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { horizontalItems } = useDisplayContext()
	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentArtists', {
						artistsInfiniteQuery: recentArtistsInfiniteQuery,
					})
				}}
			>
				<H5 marginLeft={'$2'}>Recent Artists</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={recentArtistsInfiniteQuery.data?.slice(0, horizontalItems) ?? []}
				renderItem={({ item: recentArtist }) => (
					<ItemCard
						item={recentArtist}
						caption={recentArtist.Name ?? 'Unknown Artist'}
						subCaption={pickFirstGenre(recentArtist.Genres)}
						onPress={() => {
							navigation.navigate('Artist', {
								artist: recentArtist,
							})
						}}
						onLongPress={() => {
							rootNavigation.navigate('Context', {
								item: recentArtist,
								navigation,
							})
						}}
						size={'$10'}
					></ItemCard>
				)}
			/>
		</View>
	)
}
