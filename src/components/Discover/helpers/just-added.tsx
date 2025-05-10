import { StackParamList } from '../../../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { useDiscoverContext } from '../../../providers/Discover'
import { View, XStack } from 'tamagui'
import { H2, H4 } from '../../../components/Global/helpers/text'
import Icon from '../../../components/Global/helpers/icon'

export default function RecentlyAdded({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { recentlyAdded, fetchNextRecentlyAdded, hasNextRecentlyAdded, isPendingRecentlyAdded } =
		useDiscoverContext()

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentlyAdded', {
						albums: recentlyAdded,
						navigation: navigation,
						fetchNextPage: fetchNextRecentlyAdded,
						hasNextPage: hasNextRecentlyAdded,
						isPending: isPendingRecentlyAdded,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Recently Added</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				squared
				data={
					(recentlyAdded?.pages[0].length ?? 0 > 10)
						? recentlyAdded!.pages[0].slice(0, 10)
						: recentlyAdded?.pages[0]
				}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						subCaption={`${item.Artists?.join(', ')}`}
						squared
						size={'$12'}
						item={item}
						onPress={() => {
							navigation.navigate('Album', {
								album: item,
							})
						}}
					/>
				)}
			/>
		</View>
	)
}
