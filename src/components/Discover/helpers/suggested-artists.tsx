import { View, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { ItemCard } from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useDiscoverContext } from '../../../providers/Discover'
import { H4 } from '../../Global/helpers/text'
import { StackParamList } from '../../types'

export default function SuggestedArtists({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { suggestedArtistsInfiniteQuery } = useDiscoverContext()
	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('SuggestedArtists', {
						artistsInfiniteQuery: suggestedArtistsInfiniteQuery,
						navigation: navigation,
					})
				}}
				marginLeft={'$2'}
			>
				<H4>Suggested Artists</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={suggestedArtistsInfiniteQuery.data?.slice(0, 10) ?? []}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						size={'$11'}
						item={item}
						onPress={() => {
							navigation.navigate('Artist', {
								artist: item,
							})
						}}
					/>
				)}
			/>
		</View>
	)
}
