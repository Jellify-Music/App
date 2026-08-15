import React from 'react'
import Artists, { ArtistsProps } from './component'

export default function ArtistsScreen({
	artistsInfiniteQuery: artistInfiniteQuery,
}: ArtistsProps): React.JSX.Element {
	return <Artists artistsInfiniteQuery={artistInfiniteQuery} />
}
