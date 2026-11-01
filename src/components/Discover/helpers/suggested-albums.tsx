import navigationRef from '../../../screens/navigation'
import { formatArtistNames } from '../../../utils/formatting/artist-names'
import ItemCard from '../../Global/components/Card'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { H4, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DiscoverStackParamList, { DiscoverAlbumScreenType } from '../../../screens/Discover/types'
import { useDiscoverAlbums } from '../../../api/queries/suggestions'
import AnimatedRow from '../../Global/helpers/Animated/row'

export default function SuggestedAlbums() {
	const suggestedAlbumsInfiniteQuery = useDiscoverAlbums()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const suggestedAlbumsExist =
		suggestedAlbumsInfiniteQuery.data && suggestedAlbumsInfiniteQuery.data.length > 0

	return suggestedAlbumsExist ? (
		<AnimatedRow testID='discover-suggested-albums'>
			<XStack
				alignItems='center'
				marginLeft='2'
				onPress={() => {
					navigation.navigate('Albums', {
						type: DiscoverAlbumScreenType.Suggested,
					})
				}}
			>
				<H4>More from the Vault</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={suggestedAlbumsInfiniteQuery.data}
				renderItem={({ item }) => (
					<ItemCard
						squared
						caption={item.Name}
						subCaption={formatArtistNames(item.Artists)}
						size={'10'}
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
						captionAlign='left'
					/>
				)}
			/>
		</AnimatedRow>
	) : (
		<></>
	)
}
