import React, { useMemo } from 'react'
import { useArtistContext } from '../../providers/Artist'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { SectionList, SectionListData } from 'react-native'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { convertRunTimeTicksToSeconds } from '../..//utils/runtimeticks'
import ItemRow from '../Global/components/item-row'
import ArtistHeader from './header'

export default function ArtistNavigation({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	const { featuredOn, artist, albums } = useArtistContext()

	const sections: SectionListData<BaseItemDto>[] = useMemo(() => {
		return [
			{
				title: 'Albums',
				data:
					albums?.filter(
						(album) => convertRunTimeTicksToSeconds(album.RunTimeTicks ?? 0) / 60 > 28,
					) ?? [],
			},
		]
	}, [albums])

	return (
		<SectionList
			contentInsetAdjustmentBehavior='automatic'
			sections={sections}
			ListHeaderComponent={() => ArtistHeader(artist, navigation)}
			renderItem={({ item }) => <ItemRow item={item} queueName='Album' />}
		/>
	)
}
