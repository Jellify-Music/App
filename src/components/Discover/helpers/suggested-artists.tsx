import { H5, View, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { ItemCard } from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useDiscoverContext } from '../../../providers/Discover'
import { H4 } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../../navigation'

export default function SuggestedArtists(): React.JSX.Element {
	const { suggestedArtistsInfiniteQuery } = useDiscoverContext()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

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
				<H5>Suggested Artists</H5>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={suggestedArtistsInfiniteQuery.data?.slice(0, 10) ?? []}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						size={'$10'}
						item={item}
						onPress={() => {
							navigation.navigate('Artist', {
								artist: item,
							})
						}}
						onLongPress={() =>
							navigationRef.navigate('Context', {
								item,
								navigation,
							})
						}
					/>
				)}
			/>
		</View>
	)
}
