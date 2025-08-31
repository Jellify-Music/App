import React from 'react'
import Artists, { ArtistsProps } from './component'

export default function ArtistsScreen({
	artistsInfiniteQuery: artistInfiniteQuery,
	artistPageParams,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	return (
		<Artists
			artistsInfiniteQuery={artistInfiniteQuery}
			artistPageParams={artistPageParams}
			showAlphabeticalSelector={showAlphabeticalSelector}
		/>
	)
}
