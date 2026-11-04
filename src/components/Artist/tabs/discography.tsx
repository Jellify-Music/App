import React from 'react'
import { useTranslation } from 'react-i18next'
import { useArtistContext } from '../../../providers/Artist'
import {
	RefreshControl,
	SectionBase,
	SectionListData,
	SectionListRenderItemInfo,
} from 'react-native'
import { SectionList } from '@legendapp/list/section-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemRow from '../../Global/components/item-row'
import SimilarArtists from '../similar'
import ArtistListHeader from '../list-header'
import { Spinner, useTheme, YStack, SizableText, View } from 'tamagui'
import {
	filterForAlbums,
	filterForEPs,
	filterForSingles,
	filterForUnknown,
} from '../../../configs/categorizing/albums.config'

export default function DiscographyTab(): React.JSX.Element {
	const { t } = useTranslation()

	const { featuredOn, albums, fetchingAlbums, refresh } = useArtistContext()

	const theme = useTheme()

	const sections: SectionListData<BaseItemDto>[] = albums
		? [
				{
					title: t('artist.sections.albums'),
					data: albums.filter(filterForAlbums) ?? [],
				},
				{
					title: t('artist.sections.eps'),
					data: albums.filter(filterForEPs) ?? [],
				},
				{
					title: t('artist.sections.singles'),
					data: albums.filter(filterForSingles) ?? [],
				},
				{
					title: t('artist.sections.other'),
					data: albums.filter(filterForUnknown) ?? [],
				},
				{
					title: t('artist.sections.featuredOn'),
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
					{t('artist.noAlbums')}
				</SizableText>
			)}
		</YStack>
	)

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			renderSectionHeader={renderSectionHeader}
			renderItem={renderItem}
			refreshControl={refreshControl}
			ListHeaderComponent={ArtistListHeader}
			ListFooterComponent={SimilarArtists}
			ListEmptyComponent={ListEmptyComponent}
		/>
	)
}
