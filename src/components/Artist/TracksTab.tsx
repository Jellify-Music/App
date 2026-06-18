import React from 'react'
import { useArtistContext } from '../../providers/Artist'
import Tracks from '../Tracks/component'
import { useArtistTracks } from '../../api/queries/track'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'

export default function ArtistTracksTab({
	sortBy,
	sortOrder,
	isFavorites,
}: {
	sortBy: ItemSortBy
	sortOrder: SortOrder
	isFavorites: boolean
}): React.JSX.Element {
	const { artist } = useArtistContext()

	const tracksInfiniteQuery = useArtistTracks(
		artist.Id!,
		sortBy,
		isFavorites ? undefined : sortOrder,
		isFavorites ? true : undefined,
	)

	return (
		<Tracks
			tracksInfiniteQuery={tracksInfiniteQuery}
			queue={'Artist Tracks'}
			showAlphabeticalSelector={false}
		/>
	)
}
