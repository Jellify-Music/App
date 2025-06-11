import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { StackParamList } from '../../types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { View, XStack } from 'tamagui'
import { H2, H4, Text } from '../../../components/Global/helpers/text'
import Icon from '../../Global/components/icon'
import { useHomeContext } from '../../../providers/Home'
import { ActivityIndicator } from 'react-native'
import { useDisplayContext } from '../../../providers/Display/display-provider'

export default function FrequentArtists({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const {
		frequentArtists,
		fetchNextFrequentArtists,
		hasNextFrequentArtists,
		isFetchingFrequentArtists,
	} = useHomeContext()

	const { horizontalItems } = useDisplayContext()

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedArtists', {
						artists: frequentArtists,
						fetchNextPage: fetchNextFrequentArtists,
						hasNextPage: hasNextFrequentArtists,
						isPending: isFetchingFrequentArtists,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Most Played</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={frequentArtists?.slice(0, horizontalItems) ?? []}
				renderItem={({ item: artist }) => (
					<ItemCard
						item={artist}
						caption={artist.Name ?? 'Unknown Artist'}
						onPress={() => {
							navigation.navigate('Artist', {
								artist,
							})
						}}
						size={'$11'}
					/>
				)}
				ListEmptyComponent={
					isFetchingFrequentArtists ? (
						<ActivityIndicator />
					) : (
						<Text>No frequent artists</Text>
					)
				}
			/>
		</View>
	)
}
