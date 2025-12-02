import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { H5, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedArtists } from '../../../api/queries/frequents'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { pickFirstGenre } from '../../../utils/genre-formatting'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

export default function FrequentArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()
	const { horizontalItems } = useDisplayContext()

	const renderItem = useCallback(
		({ item: artist }: { item: BaseItemDto }) => (
			<ItemCard
				item={artist}
				caption={artist.Name ?? 'Unknown Artist'}
				subCaption={pickFirstGenre(artist.Genres)}
				onPress={() => {
					navigation.navigate('Artist', {
						artist,
					})
				}}
				onLongPress={() => {
					rootNavigation.navigate('Context', {
						item: artist,
						navigation,
					})
				}}
				size={'$10'}
			/>
		),
		[],
	)

	return frequentArtistsInfiniteQuery.data ? (
		<Animated.View
			entering={FadeIn}
			exiting={FadeOut}
			layout={LinearTransition.springify()}
			style={{
				flex: 1,
			}}
		>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedArtists', {
						artistsInfiniteQuery: frequentArtistsInfiniteQuery,
					})
				}}
			>
				<H5 marginLeft={'$2'}>Most Played</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={frequentArtistsInfiniteQuery.data.slice(0, horizontalItems) ?? []}
				renderItem={renderItem}
			/>
		</Animated.View>
	) : (
		<></>
	)
}
