import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { StackParamList } from '../../../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'
import { ItemCard } from '../../../components/Global/components/item-card'
import { View, XStack } from 'tamagui'
import { H2, H4 } from '../../../components/Global/helpers/text'
import Icon from '../../../components/Global/helpers/icon'
import { useHomeContext } from '../../../providers/Home'

export default function FrequentArtists({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { frequentArtists, fetchNextFrequentArtists, hasNextFrequentArtists } = useHomeContext()

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedArtists', {
						artists: frequentArtists,
						fetchNextPage: fetchNextFrequentArtists,
						hasNextPage: hasNextFrequentArtists,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Most Played</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={
					(frequentArtists?.pages.flatMap((page) => page).length ?? 0 > 10)
						? frequentArtists?.pages.flatMap((page) => page).slice(0, 10)
						: frequentArtists?.pages.flatMap((page) => page)
				}
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
			/>
		</View>
	)
}
