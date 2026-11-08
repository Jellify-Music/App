import React from 'react'
import { H4, XStack } from 'tamagui'
import { RootStackParamList } from '../../../screens/types'
import ItemCard from '../../Global/components/Card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useNavigation } from '@react-navigation/native'
import HomeStackParamList from '../../../screens/Home/types'
import { pickFirstGenre } from '../../../utils/formatting/genres'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto'
import AnimatedRow from '../../Global/helpers/Animated/row'
import { useRecentlyUpdatedPlaylists } from '../../../api/queries/playlist'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

export default function RecentPlaylists(): React.JSX.Element {
	const recentPlaylistsQuery = useRecentlyUpdatedPlaylists()

	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const handleHeaderPress = () => {
		navigation.navigate('RecentPlaylists')
	}

	const renderItem = ({ item: recentPlaylist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemCard
			item={recentPlaylist}
			caption={recentPlaylist.Name ?? 'Unknown Playlist'}
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
			<XStack alignItems='center' onPress={handleHeaderPress}>
				<H4 marginLeft='2'>Your Playlists</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList data={recentPlaylistsQuery.data} renderItem={renderItem} />
		</AnimatedRow>
	) : (
		<></>
	)
}
