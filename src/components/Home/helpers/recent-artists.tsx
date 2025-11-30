import React, { useCallback, useMemo } from 'react'
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
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'

export default function RecentArtists(): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { horizontalItems } = useDisplayContext()

	const handleHeaderPress = useCallback(() => {
		navigation.navigate('RecentArtists')
	}, [navigation])

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
		({ item: recentArtist }: { item: BaseItemDto }) => (
			<ItemCard
				item={recentArtist}
				caption={recentArtist.Name ?? 'Unknown Artist'}
				subCaption={pickFirstGenre(recentArtist.Genres)}
				onPress={() => handleArtistPress(recentArtist)}
				onLongPress={() => handleArtistLongPress(recentArtist)}
				size={'$10'}
			/>
		),
		[handleArtistPress, handleArtistLongPress],
	)

	const displayData = useMemo(() => {
		const data = recentArtistsInfiniteQuery.data ?? []
		// Deduplicate by Id to prevent key conflicts
		const seen = new Set<string>()
		const unique = data.filter((artist) => {
			if (!artist.Id || seen.has(artist.Id)) return false
			seen.add(artist.Id)
			return true
		})
		return unique.slice(0, horizontalItems)
	}, [recentArtistsInfiniteQuery.data, horizontalItems])

	return (
		<View>
			<XStack alignItems='center' onPress={handleHeaderPress}>
				<H5 marginLeft={'$2'}>Recent Artists</H5>
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
