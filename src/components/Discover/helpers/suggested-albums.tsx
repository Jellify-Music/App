import navigationRef from '../../../../navigation'
import { formatArtistNames } from '../../../utils/formatting/artist-names'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import ItemCard from '../../Global/components/item-card'
import HorizontalCardList from '../../Global/components/horizontal-list'
import { XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { H5 } from '../../Global/helpers/text'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import DiscoverStackParamList from '../../../screens/Discover/types'
import { useDiscoverAlbums } from '../../../api/queries/suggestions'

export default function SuggestedAlbums() {
	const suggestedAlbumsInfiniteQuery = useDiscoverAlbums()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const suggestedAlbumsExist =
		suggestedAlbumsInfiniteQuery.data && suggestedAlbumsInfiniteQuery.data.length > 0

	return suggestedAlbumsExist ? (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
			testID='discover-suggested-albums'
			style={{
				flex: 1,
			}}
		>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('Albums', {
						albumsInfiniteQuery: suggestedAlbumsInfiniteQuery,
					})
				}}
				marginLeft={'$2'}
			>
				<H5>More from the Vault</H5>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList
				data={suggestedAlbumsInfiniteQuery.data?.slice(0, 10) ?? []}
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
		</Animated.View>
	) : null
}
