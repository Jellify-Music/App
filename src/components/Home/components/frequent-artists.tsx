import { useTranslation } from 'react-i18next'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import React from 'react'
import ItemCard from '../../Global/components/Card'
import { H4, XStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { useNavigation, RootNavigator } from '@react-navigation/native'
import { HomeStackNavigator } from '../../../screens/Home/types'
import { useFrequentlyPlayedArtists } from '../../../api/queries/frequents'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import AnimatedRow from '../../Global/utils/Animated/row'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function FrequentArtists(): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation<HomeStackNavigator>()
	const rootNavigation = useNavigation<RootNavigator>()

	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	const renderItem = ({ item: artist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			item={artist}
			caption={artist.Name ?? t('placeholders.unknownArtist')}
			subCaption={pickFirstGenre(artist.Genres)}
			onPress={() => {
				navigation.navigate('Artist', {
					artist,
				})
			}}
			onLongPress={() => {
				rootNavigation.navigate('Context', {
					item: artist,
					navigation,
				})
			}}
		/>
	)

	return frequentArtistsInfiniteQuery.data ? (
		<AnimatedRow testID='home-frequent-artists'>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('MostPlayedArtists')
				}}
				transition='quick'
				opacity='1 press:0.6'
				marginHorizontal='2'
			>
				<H4 userSelect='none'>{t('home.mostPlayed')}</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList data={frequentArtistsInfiniteQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
