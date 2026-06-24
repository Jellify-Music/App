import navigationRef from '../../../screens/navigation'
import { formatArtistNames } from '../../../utils/formatting/artist-names'
import ItemCard from '../../Global/components/item-card'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { H5 } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DiscoverStackParamList, { DiscoverAlbumScreenType } from '../../../screens/Discover/types'
import { useDiscoverAlbums } from '../../../api/queries/suggestions'
import AnimatedRow from '../../Global/helpers/animated-row'
import { useDisplayContext } from '../../../providers/Display/display-provider'

export default function SuggestedAlbums() {
	const suggestedAlbumsInfiniteQuery = useDiscoverAlbums()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const suggestedAlbumsExist =
		suggestedAlbumsInfiniteQuery.data && suggestedAlbumsInfiniteQuery.data.length > 0

	const { horizontalItems } = useDisplayContext()

	return suggestedAlbumsExist ? (
		<AnimatedRow testID='discover-suggested-albums'>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('Albums', {
						type: DiscoverAlbumScreenType.Suggested,
					})
				}}
				marginLeft={'$2'}
			>
				<H5>More from the Vault</H5>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={suggestedAlbumsInfiniteQuery.data?.slice(0, horizontalItems)}
				renderItem={({ item }) => (
					<ItemCard
						squared
						caption={item.Name}
						subCaption={formatArtistNames(item.Artists)}
						size={'$10'}
						item={item}
						onPress={() => {
							navigation.navigate('Album', {
								album: item,
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
		</AnimatedRow>
	) : (
		<></>
	)
}
