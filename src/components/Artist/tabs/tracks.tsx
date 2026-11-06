import React from 'react'
import { useArtistContext } from '../../../providers/Artist'
import { useArtistTracks } from '../../../api/queries/track'
import Tracks from '../../Tracks/component'
import ArtistListHeader from '../list-header'

/** Every track by the artist, alphabetically, with the A-Z scrubber */
export default function TracksTab(): React.JSX.Element {
	const { artist } = useArtistContext()

	const tracksInfiniteQuery = useArtistTracks(artist.Id!)

	return (
		<Tracks
			tracksInfiniteQuery={tracksInfiniteQuery}
			showAlphabeticalSelector
			queue={artist}
			ListHeaderComponent={<ArtistListHeader />}
		/>
	)
}
