import React, { useCallback, useMemo } from 'react'
import { useArtistContext } from '../../providers/Artist'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { DefaultSectionT, SectionList, SectionListData } from 'react-native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import ItemRow from '../Global/components/item-row'
import ArtistHeader from './header'
import { Text } from '../Global/helpers/text'
import SimilarArtists from './similar'

export default function ArtistOverviewTab({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	const { featuredOn, artist, albums } = useArtistContext()

	const sections: SectionListData<BaseItemDto>[] = useMemo(() => {
		return [
			{
				title: 'Albums',
				data: albums?.filter(({ ChildCount }) => (ChildCount ?? 0) > 6) ?? [],
			},
			{
				title: 'EPs',
				data:
					albums?.filter(
						({ ChildCount }) => (ChildCount ?? 0) <= 6 && (ChildCount ?? 0) >= 3,
					) ?? [],
			},
			{
				title: 'Singles',
				data: albums?.filter(({ ChildCount }) => (ChildCount ?? 0) === 1) ?? [],
			},
			{
				title: '',
				data: albums?.filter(({ ChildCount }) => typeof ChildCount !== 'number') ?? [],
			},
			{
				title: 'Featured On',
				data: featuredOn ?? [],
			},
		]
	}, [artist, albums?.map(({ Id }) => Id)])

	const renderSectionHeader = useCallback(
		({ section }: { section: SectionListData<BaseItemDto, DefaultSectionT> }) =>
			section.data.length > 0 ? (
				<Text padding={'$3'} fontSize={'$6'} bold backgroundColor={'$background'}>
					{section.title}
				</Text>
			) : null,
		[],
	)

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			ListHeaderComponent={ArtistHeader}
			renderSectionHeader={renderSectionHeader}
			renderItem={({ item }) => <ItemRow item={item} navigation={navigation} />}
			ListFooterComponent={SimilarArtists}
		/>
	)
}
