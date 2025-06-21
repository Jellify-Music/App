import React from 'react'
import { View, XStack } from 'tamagui'
import { useHomeContext } from '../../../providers/Home'
import { H4 } from '../../Global/helpers/text'
import { StackParamList } from '../../types'
import { ItemCard } from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'

export default function RecentArtists({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { recentArtists, fetchNextRecentArtists, hasNextRecentArtists, isFetchingRecentArtists } =
		useHomeContext()

	const { horizontalItems } = useDisplayContext()
	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentArtists', {
						artists: recentArtists,
						fetchNextPage: fetchNextRecentArtists,
						hasNextPage: hasNextRecentArtists,
						isPending: isFetchingRecentArtists,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Recent Artists</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={recentArtists?.slice(0, horizontalItems) ?? []}
				renderItem={({ item: recentArtist }) => (
					<ItemCard
						item={recentArtist}
						caption={recentArtist.Name ?? 'Unknown Artist'}
						onPress={() => {
							navigation.navigate('Artist', {
								artist: recentArtist,
							})
						}}
						size={'$11'}
					></ItemCard>
				)}
			/>
		</View>
	)
}
