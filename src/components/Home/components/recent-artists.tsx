import { useTranslation } from 'react-i18next'
import React from 'react'
import { H4, XStack } from 'tamagui'
import ItemCard from '../../Global/components/Card'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useNavigation, RootNavigator } from '@react-navigation/native'
import { HomeStackNavigator } from '../../../screens/Home/types'
import { useRecentArtists } from '../../../api/queries/recents'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import AnimatedRow from '../../Global/utils/Animated/row'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function RecentArtists(): React.JSX.Element {
	const { t } = useTranslation()

	const recentArtistsInfiniteQuery = useRecentArtists()

	const navigation = useNavigation<HomeStackNavigator>()

	const rootNavigation = useNavigation<RootNavigator>()

	const handleHeaderPress = () => {
		navigation.navigate('RecentArtists')
	}

	const renderItem = ({ item: recentArtist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			item={recentArtist}
			caption={recentArtist.Name ?? t('placeholders.unknownArtist')}
			subCaption={pickFirstGenre(recentArtist.Genres)}
			onPress={() => {
				navigation.navigate('Artist', {
					artist: recentArtist,
				})
			}}
			onLongPress={() => {
				rootNavigation.navigate('Context', {
					item: recentArtist,
					navigation,
				})
			}}
		/>
	)

	return recentArtistsInfiniteQuery.data ? (
		<AnimatedRow testID='home-recent-artists'>
			<XStack
				alignItems='center'
				onPress={handleHeaderPress}
				transition='quick'
				opacity='1 press:0.6'
				marginHorizontal='2'
			>
				<H4 userSelect='none'>{t('home.recentArtists')}</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList data={recentArtistsInfiniteQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
