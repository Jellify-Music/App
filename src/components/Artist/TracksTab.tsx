import React, { useState } from 'react'
import { useArtistContext } from '../../providers/Artist'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import Tracks from '../Tracks/component'
import useTracks from '../../api/queries/track'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'

export default function ArtistTracksTab({
	navigation,
	sortBy,
	sortOrder,
	isFavorites,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
	sortBy: ItemSortBy
	sortOrder: SortOrder
	isFavorites: boolean
}): React.JSX.Element {
	const { artist } = useArtistContext()

	const [trackPageParams, tracksInfiniteQuery] = useTracks(
		artist.Id,
		sortBy,
		isFavorites ? undefined : sortOrder,
		isFavorites ? true : undefined,
	)

	return (
		<Tracks
			navigation={navigation}
			tracksInfiniteQuery={tracksInfiniteQuery}
			queue={'Artist Tracks'}
			showAlphabeticalSelector={false}
			trackPageParams={trackPageParams}
		/>
	)
}
