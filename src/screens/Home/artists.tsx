import React from 'react'
import Artists from '../../components/Artists/component'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useRecentArtists } from '../../api/queries/recents'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'

export default function HomeArtistsScreen({
	navigation,
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	if (route.name === 'MostPlayedArtists') {
		return (
			<Artists
				artistsInfiniteQuery={frequentArtistsInfiniteQuery}
				showAlphabeticalSelector={false}
			/>
		)
	}

	return (
		<Artists
			artistsInfiniteQuery={recentArtistsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
