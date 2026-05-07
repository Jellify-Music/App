import { H5, View, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import ItemCard from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import DiscoverStackParamList from '../../../screens/Discover/types'
import navigationRef from '../../../screens/navigation'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import { useDiscoverArtists } from '../../../api/queries/suggestions'
import AnimatedRow from '../../Global/helpers/animated-row'
import { ListRenderItemInfo } from '@shopify/flash-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'

export default function SuggestedArtists(): React.JSX.Element {
	const suggestedArtistsInfiniteQuery = useDiscoverArtists()

	const navigation = useNavigation<NativeStackNavigationProp<DiscoverStackParamList>>()

	const suggestedArtistsExist =
		suggestedArtistsInfiniteQuery.data && suggestedArtistsInfiniteQuery.data.length > 0

	const renderItem = ({ item, index }: ListRenderItemInfo<BaseItemDto>) => (
		<ItemCard
			caption={item.Name}
			subCaption={pickFirstGenre(item.Genres)}
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
			testID={`suggested-artist-item-${index}`}
		/>
	)

	return suggestedArtistsExist ? (
		<AnimatedRow testID='discover-suggested-artists'>
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
				renderItem={renderItem}
			/>
		</AnimatedRow>
	) : (
		<></>
	)
}
