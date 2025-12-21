import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import { ItemCard } from '../../../components/Global/components/item-card'
import { H5, View, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../../navigation'
import { useRecentlyAddedAlbums } from '../../../api/queries/album'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

export default function RecentlyAdded(): React.JSX.Element | null {
	const recentlyAddedAlbumsInfinityQuery = useRecentlyAddedAlbums()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const recentlyAddedExists =
		recentlyAddedAlbumsInfinityQuery.data && recentlyAddedAlbumsInfinityQuery.data.length > 0

	return recentlyAddedExists ? (
		<Animated.View
			entering={FadeIn.springify()}
			exiting={FadeOut.springify()}
			layout={LinearTransition.springify()}
			testID='discover-recently-added'
			style={{
				flex: 1,
			}}
		>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('RecentlyAdded', {
						albumsInfiniteQuery: recentlyAddedAlbumsInfinityQuery,
					})
				}}
			>
				<H5 marginLeft={'$2'}>Recently Added</H5>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={recentlyAddedAlbumsInfinityQuery.data?.slice(0, 10) ?? []}
				renderItem={({ item }) => (
					<ItemCard
						caption={item.Name}
						subCaption={`${item.Artists?.join(', ')}`}
						squared
						size={'$11'}
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
						gap={'$1'}
						captionAlign='left'
					/>
				)}
			/>
		</Animated.View>
	) : null
}
