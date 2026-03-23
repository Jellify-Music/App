import React from 'react'
import { useArtistContext } from '../../providers/Artist'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { DefaultSectionT, RefreshControl, SectionList, SectionListData } from 'react-native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemRow from '../Global/components/item-row'
import ArtistHeader from './header'
import { Text } from '../Global/helpers/text'
import SimilarArtists from './similar'
import { Spinner, useTheme, YStack } from 'tamagui'
import {
	filterForAlbums,
	filterForEPs,
	filterForSingles,
	filterForUnknown,
} from '../../configs/albums.config'

export default function ArtistOverviewTab({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	const { featuredOn, albums, fetchingAlbums, refresh } = useArtistContext()

	const theme = useTheme()

	const sections: SectionListData<BaseItemDto>[] = albums
		? [
				{
					title: 'Albums',
					data: albums.filter(filterForAlbums) ?? [],
				},
				{
					title: 'EPs',
					data: albums.filter(filterForEPs) ?? [],
				},
				{
					title: 'Singles',
					data: albums.filter(filterForSingles) ?? [],
				},
				{
					title: 'Other',
					data: albums.filter(filterForUnknown) ?? [],
				},
				{
					title: 'Featured On',
					data: featuredOn ?? [],
				},
			]
		: []

	const renderSectionHeader = ({
		section,
	}: {
		section: SectionListData<BaseItemDto, DefaultSectionT>
	}) =>
		section.data.length > 0 ? (
			<Text padding={'$2'} fontSize={'$6'} bold backgroundColor={'$background'}>
				{section.title}
			</Text>
		) : null

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			ListHeaderComponent={ArtistHeader}
			renderSectionHeader={renderSectionHeader}
			renderItem={({ item }) => <ItemRow item={item} navigation={navigation} />}
			refreshControl={
				<RefreshControl
					refreshing={fetchingAlbums}
					onRefresh={refresh}
					tintColor={theme.primary.val}
				/>
			}
			ListFooterComponent={SimilarArtists}
			ListEmptyComponent={
				<YStack justifyContent='center' alignContent='center'>
					{fetchingAlbums ? (
						<Spinner color={'$primary'} flex={1} />
					) : (
						<Text color={'$neutral'}>No albums</Text>
					)}
				</YStack>
			}
		/>
	)
}
