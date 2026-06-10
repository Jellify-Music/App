import React from 'react'

import Tracks from '../../Tracks/component'
import useTracks from '../../../api/queries/track'
import useLibraryStore from '../../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client'

function TracksTab(): React.JSX.Element {
	const filters = useLibraryStore((state) => state.filters)
	const sortBy = useLibraryStore((state) => state.sortBy.tracks)
	const sortDescending = useLibraryStore((state) => {
		const sd = state.sortDescending as Record<string, boolean> | boolean
		if (typeof sd === 'boolean') return sd
		return sd?.tracks ?? false
	})
	const { isFavorites, isDownloaded, isUnplayed } = filters.tracks

	const showAlphabeticalSelector =
		sortBy === ItemSortBy.Name ||
		sortBy === ItemSortBy.SortName ||
		sortBy === ItemSortBy.Album ||
		sortBy === ItemSortBy.Artist

	const tracksInfiniteQuery = useTracks(
		sortBy,
		sortDescending ? SortOrder.Descending : SortOrder.Ascending,
		isFavorites,
		isUnplayed,
	)

	return (
		<Tracks
			tracksInfiniteQuery={tracksInfiniteQuery}
			queue={isFavorites ? 'Favorite Tracks' : isDownloaded ? 'Downloaded Tracks' : 'Library'}
			showAlphabeticalSelector={showAlphabeticalSelector}
			sortBy={sortBy as ItemSortBy}
			sortDescending={sortDescending}
		/>
	)
}

export default TracksTab
