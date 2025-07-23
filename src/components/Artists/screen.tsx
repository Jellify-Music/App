import React from 'react'
import Artists from './component'
import { ArtistsProps, StackParamList } from '../types'

export default function ArtistsScreen({
	navigation,
	artistsInfiniteQuery: artistInfiniteQuery,
	showAlphabeticalSelector,
}: ArtistsProps): React.JSX.Element {
	return (
		<Artists
			navigation={navigation}
			artistsInfiniteQuery={artistInfiniteQuery}
			showAlphabeticalSelector={showAlphabeticalSelector}
		/>
	)
}
