import React from 'react'
import { useArtistContext } from '../../providers/Artist'
import {
	RefreshControl,
	SectionBase,
	SectionListData,
	SectionListRenderItemInfo,
} from 'react-native'
import { SectionList } from '@legendapp/list/section-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemRow from '../Global/components/item-row'
import ArtistHeader from './header'
import SimilarArtists from './similar'
import { Spinner, useTheme, YStack, SizableText, View } from 'tamagui'
import {
	filterForAlbums,
	filterForEPs,
	filterForSingles,
	filterForUnknown,
} from '../../configs/categorizing/albums.config'

export default function Artist(): React.JSX.Element {
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
			<SizableText padding={'2'} size={'3'} fontWeight='6' backgroundColor={'background'}>
				{section.title}
			</SizableText>
		) : null

	const renderItem = ({
		item,
	}: SectionListRenderItemInfo<BaseItemDto, SectionBase<BaseItemDto>>) => (
		<View marginHorizontal='2'>
			<ItemRow item={item} />
		</View>
	)

	const ListEmptyComponent = (
		<YStack justifyContent='center' alignContent='center'>
			{fetchingAlbums ? (
				<Spinner color='primary' flex={1} />
			) : (
				<SizableText fontSize='3' color={'neutral'}>
					No albums
				</SizableText>
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
