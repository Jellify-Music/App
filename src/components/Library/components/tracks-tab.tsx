import React from 'react'

import Tracks from '../../Tracks/component'
import { useNavigation } from '@react-navigation/native'
import LibraryStackParamList from '@/src/screens/Library/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import useTracks from '../../../api/queries/track'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

function TracksTab(): React.JSX.Element {
	const [trackPageParams, tracksInfiniteQuery] = useTracks()

	const filters = useLibraryStore((state) => state.filters)
	const sortBy = useLibraryStore((state) => {
		const sb = state.sortBy as Record<string, string> | string
		if (typeof sb === 'string') return sb
		return sb?.tracks ?? ItemSortBy.Name
	})
	const sortDescending = useLibraryStore((state) => {
		const sd = state.sortDescending as Record<string, boolean> | boolean
		if (typeof sd === 'boolean') return sd
		return sd?.tracks ?? false
	})
	const { isFavorites, isDownloaded } = filters.tracks
	// Show A-Z when sort is by name OR when data already has letter sections (e.g. after sort change)
	const hasLetterSections =
		tracksInfiniteQuery.data?.some((item) => typeof item === 'string') ?? false
	const showAlphabeticalSelector =
		hasLetterSections ||
		sortBy === ItemSortBy.Name ||
		sortBy === ItemSortBy.SortName ||
		sortBy === ItemSortBy.Album ||
		sortBy === ItemSortBy.Artist

	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	return (
		<Tracks
			navigation={navigation}
			tracksInfiniteQuery={tracksInfiniteQuery}
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
			showAlphabeticalSelector={showAlphabeticalSelector}
			sortBy={sortBy as ItemSortBy}
			sortDescending={sortDescending}
			trackPageParams={trackPageParams}
		/>
	)
}

export default TracksTab
