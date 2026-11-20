import React from 'react'
import { useArtistContext } from '../../../providers/Artist'
import { useArtistTracks } from '../../../api/queries/track'
import Tracks from '../../Tracks/component'
import { ListChromeProvider } from '../../Global/components/Lists/chrome'
import ArtistListHeader from '../list-header'
import { useArtistListScroll } from '../scroll'

/** Every track by the artist, alphabetically, with the A-Z scrubber */
export default function TracksTab(): React.JSX.Element {
	const { artist } = useArtistContext()

	const tracksInfiniteQuery = useArtistTracks(artist.Id!)

	const { onScroll, topInset } = useArtistListScroll()

	return (
		<ListChromeProvider value={{ topInset, onScroll }}>
			<Tracks
				tracksInfiniteQuery={tracksInfiniteQuery}
				showAlphabeticalSelector
				queue={artist}
				ListHeaderComponent={<ArtistListHeader />}
			/>
		</ListChromeProvider>
	)
}
