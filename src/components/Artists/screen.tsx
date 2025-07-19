import React from 'react'
import Artists from './component'
import { ArtistsProps, StackParamList } from '../types'

export default function ArtistsScreen({
	navigation,
	artists,
	fetchNextPage,
	hasNextPage,
	isPending,
	isFetchingNextPage,
	showAlphabeticalSelector,
	isFetchPreviousPageError,
}: ArtistsProps): React.JSX.Element {
	return (
		<Artists
			navigation={navigation}
			artists={artists}
			fetchNextPage={fetchNextPage}
			hasNextPage={hasNextPage}
			isPending={isPending}
			isFetchingNextPage={isFetchingNextPage}
			showAlphabeticalSelector={showAlphabeticalSelector}
			isFetchPreviousPageError={isFetchPreviousPageError}
		/>
	)
}
