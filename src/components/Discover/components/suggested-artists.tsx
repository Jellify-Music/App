import { H4, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import HorizontalCardList from '../../Global/components/horizontal-list'
import ItemCard from '../../Global/components/Card'
import { useNavigation } from '@react-navigation/native'
import { DiscoverStackNavigator } from '../../../screens/Discover/types'
import navigationRef from '../../../screens/navigation'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import { useDiscoverArtists } from '../../../api/queries/suggestions'
import AnimatedRow from '../../Global/utils/Animated/row'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import { useTranslation } from 'react-i18next'

export default function SuggestedArtists(): React.JSX.Element {
	const { t } = useTranslation()

	const suggestedArtistsInfiniteQuery = useDiscoverArtists()

	const navigation = useNavigation<DiscoverStackNavigator>()

	const suggestedArtistsExist =
		suggestedArtistsInfiniteQuery.data && suggestedArtistsInfiniteQuery.data.length > 0

	const renderItem = ({ item, index }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			caption={item.Name}
			subCaption={pickFirstGenre(item.Genres)}
			size={'10'}
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
				marginHorizontal='2'
				onPress={() => navigation.navigate('SuggestedArtists')}
				transition='quick'
				opacity='1 press:0.6'
			>
				<H4 userSelect='none'>{t('discover.artistsForYou')}</H4>
				<Icon name='arrow-right' />
			</XStack>
			<HorizontalCardList data={suggestedArtistsInfiniteQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
