import React from 'react'
import { useArtistContext } from '../../providers/Artist'
import {
	DefaultSectionT,
	RefreshControl,
	SectionBase,
	SectionListData,
	SectionListRenderItemInfo,
} from 'react-native'
import { SectionList } from '@legendapp/list/section-list'
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

export default function ArtistOverviewTab(): React.JSX.Element {
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

	const refreshControl = (
		<RefreshControl
			refreshing={fetchingAlbums}
			onRefresh={refresh}
			tintColor={theme.primary.val}
		/>
	)

	const renderSectionHeader = ({ section }: { section: SectionListData<BaseItemDto> }) =>
		section.data.length > 0 ? (
			<Text padding={'$2'} fontSize={'$6'} bold backgroundColor={'$background'}>
				{section.title}
			</Text>
		) : null

	const renderItem = ({
		item,
	}: SectionListRenderItemInfo<BaseItemDto, SectionBase<BaseItemDto, DefaultSectionT>>) => {
		return <ItemRow item={item} />
	}

	const ListEmptyComponent = (
		<YStack justifyContent='center' alignContent='center'>
			{fetchingAlbums ? (
				<Spinner color={'$primary'} flex={1} />
			) : (
				<Text color={'$neutral'}>No albums</Text>
			)}
		</YStack>
	)

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			ListHeaderComponent={ArtistHeader}
			renderSectionHeader={renderSectionHeader}
			renderItem={renderItem}
			refreshControl={refreshControl}
			ListFooterComponent={SimilarArtists}
			ListEmptyComponent={ListEmptyComponent}
		/>
	)
}
