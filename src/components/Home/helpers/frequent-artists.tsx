import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { H5, View, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedArtists } from '../../../api/queries/frequents'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { pickFirstGenre } from '../../../utils/genre-formatting'

export default function FrequentArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()
	const { horizontalItems } = useDisplayContext()

	const handleArtistPress = useCallback(
		(artist: BaseItemDto) => {
			navigation.navigate('Artist', { artist })
		},
		[navigation],
	)

	const handleArtistLongPress = useCallback(
		(artist: BaseItemDto) => {
			rootNavigation.navigate('Context', {
				item: artist,
				navigation,
			})
		},
		[rootNavigation, navigation],
	)

	const renderItem = useCallback(
		({ item: artist }: { item: BaseItemDto }) => (
			<ItemCard
				item={artist}
				caption={artist.Name ?? 'Unknown Artist'}
				subCaption={pickFirstGenre(artist.Genres)}
				onPress={() => handleArtistPress(artist)}
				onLongPress={() => handleArtistLongPress(artist)}
				size={'$10'}
			/>
		),
		[handleArtistPress, handleArtistLongPress],
	)

	const displayData = useMemo(() => {
		const data = frequentArtistsInfiniteQuery.data ?? []
		// Deduplicate by Id to prevent key conflicts
		const seen = new Set<string>()
		const unique = data.filter((artist) => {
			if (!artist.Id || seen.has(artist.Id)) return false
			seen.add(artist.Id)
			return true
		})
		return unique.slice(0, horizontalItems)
	}, [frequentArtistsInfiniteQuery.data, horizontalItems])

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
				<H5 marginLeft={'$2'}>Most Played</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={displayData}
				renderItem={renderItem}
				keyExtractor={(item) => item.Id!}
			/>
		</View>
	)
}
