import React from 'react'
import Artists from '../../components/Artists/component'
import { MostPlayedArtistsProps, RecentArtistsProps } from '../../components/types'
import { useHomeContext } from '../../providers/Home'

export default function HomeArtistsScreen({
	navigation,
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const { recentArtistsInfiniteQuery, frequentArtistsInfiniteQuery } = useHomeContext()

	if (route.name === 'MostPlayedArtists') {
		return (
			<Artists
				navigation={navigation}
				artistsInfiniteQuery={frequentArtistsInfiniteQuery}
				showAlphabeticalSelector={false}
			/>
		)
	}

	return (
		<Artists
			navigation={navigation}
			artistsInfiniteQuery={recentArtistsInfiniteQuery}
			showAlphabeticalSelector={false}
		/>
	)
}
