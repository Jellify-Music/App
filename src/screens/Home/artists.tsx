import React from 'react'
import Artists from '../../components/Artists/component'
import { MostPlayedArtistsProps, RecentArtistsProps } from '../../components/types'
import { useHomeContext } from '../../providers/Home'

export default function HomeArtistsScreen({
	navigation,
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const {
		recentArtists,
		frequentArtists,
		fetchNextRecentArtists,
		hasNextRecentArtists,
		fetchNextFrequentArtists,
		hasNextFrequentArtists,
		isFetchingRecentArtists,
		isFetchingFrequentArtists,
		isFetchPreviousFrequentArtistsPageError,
		isFetchPreviousRecentArtistsPageError,
	} = useHomeContext()

	if (route.name === 'MostPlayedArtists') {
		return (
			<Artists
				navigation={navigation}
				artists={frequentArtists}
				fetchNextPage={fetchNextFrequentArtists}
				hasNextPage={hasNextFrequentArtists}
				isPending={isFetchingFrequentArtists}
				isFetchingNextPage={isFetchingFrequentArtists}
				showAlphabeticalSelector={false}
				isFetchPreviousPageError={isFetchPreviousFrequentArtistsPageError}
			/>
		)
	}

	return (
		<Artists
			navigation={navigation}
			artists={recentArtists}
			fetchNextPage={fetchNextRecentArtists}
			hasNextPage={hasNextRecentArtists}
			isPending={isFetchingRecentArtists}
			isFetchingNextPage={isFetchingRecentArtists}
			showAlphabeticalSelector={false}
			isFetchPreviousPageError={isFetchPreviousRecentArtistsPageError}
		/>
	)
}
