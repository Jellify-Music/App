import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { useTheme, View, XStack } from 'tamagui'
import { H4, Text } from '../../../components/Global/helpers/text'
import Icon from '../../Global/components/icon'
import { ActivityIndicator } from 'react-native'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { RootStackParamList } from '../../../screens/types'
import { useFrequentlyPlayedArtists } from '../../../api/queries/frequents'

export default function FrequentArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()
	const theme = useTheme()
	const { horizontalItems } = useDisplayContext()

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
				renderItem={({ item: artist }) => (
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
						size={'$11'}
					/>
				)}
				ListEmptyComponent={
					<View flex={1} justifyContent='center' alignItems='center' height={'$11'}>
						{frequentArtistsInfiniteQuery.isLoading ? (
							<ActivityIndicator color={theme.primary.val} />
						) : (
							<Text>No frequent artists</Text>
						)}
					</View>
				}
			/>
		</View>
	)
}
