import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { useDiscoverContext } from '../../../providers/Discover'
import { View, XStack } from 'tamagui'
import { H4 } from '../../../components/Global/helpers/text'
import Icon from '../../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../../navigation'
import { useRecentlyAddedAlbums } from '../../../api/queries/album'

export default function RecentlyAdded(): React.JSX.Element {
	const recentlyAddedAlbumsInfinityQuery = useRecentlyAddedAlbums()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentlyAdded', {
						albumsInfiniteQuery: recentlyAddedAlbumsInfinityQuery,
					})
				}}
			>
				<H4 marginLeft={'$2'}>Recently Added</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={recentlyAddedAlbumsInfinityQuery.data?.slice(0, 10) ?? []}
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
						onLongPress={() => {
							navigationRef.navigate('Context', {
								item,
								navigation,
							})
						}}
					/>
				)}
			/>
		</View>
	)
}
