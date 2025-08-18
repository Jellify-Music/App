import React from 'react'
import Artists from './component'
import { ArtistsProps } from '../../screens/types'

export default function ArtistsScreen({
	artistsInfiniteQuery: artistInfiniteQuery,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	return (
		<Artists
			artistsInfiniteQuery={artistInfiniteQuery}
			showAlphabeticalSelector={showAlphabeticalSelector}
		/>
	)
}
