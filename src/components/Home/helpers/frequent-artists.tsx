import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback } from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { View, XStack } from 'tamagui'
import { H4 } from '../../../components/Global/helpers/text'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedArtists } from '../../../api/queries/frequents'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

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

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedArtists', {
						artistsInfiniteQuery: frequentArtistsInfiniteQuery,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Most Played</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={frequentArtistsInfiniteQuery.data?.slice(0, horizontalItems) ?? []}
				renderItem={renderItem}
			/>
		</View>
	)
}
