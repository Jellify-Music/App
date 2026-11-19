import { useTranslation } from 'react-i18next'
import React from 'react'
import { H4, XStack } from 'tamagui'
import ItemCard from '../../Global/components/Card'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useNavigation, RootNavigator } from '@react-navigation/native'
import { HomeStackNavigator } from '../../../screens/Home/types'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import AnimatedRow from '../../Global/utils/Animated/row'
import { useRecentlyUpdatedPlaylists } from '../../../api/queries/playlist'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function RecentPlaylists(): React.JSX.Element {
	const { t } = useTranslation()

	const recentPlaylistsQuery = useRecentlyUpdatedPlaylists()

	const navigation = useNavigation<HomeStackNavigator>()

	const rootNavigation = useNavigation<RootNavigator>()

	const handleHeaderPress = () => {
		navigation.navigate('RecentPlaylists')
	}

	const renderItem = ({ item: recentPlaylist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			item={recentPlaylist}
			caption={recentPlaylist.Name ?? t('placeholders.unknownPlaylist')}
			captionAlign='left'
			subCaption={pickFirstGenre(recentPlaylist.Genres)}
			onPress={() => {
				navigation.navigate('Playlist', {
					playlist: recentPlaylist,
					canEdit: true,
				})
			}}
			onLongPress={() => {
				rootNavigation.navigate('Context', {
					item: recentPlaylist,
					navigation,
				})
			}}
		/>
	)

	return recentPlaylistsQuery.data ? (
		<AnimatedRow testID='home-recent-playlists'>
			<XStack
				alignItems='center'
				onPress={handleHeaderPress}
				transition='quick'
				opacity='1 press:0.6'
				marginHorizontal='2'
			>
				<H4 userSelect='none'>{t('home.yourPlaylists')}</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList data={recentPlaylistsQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
