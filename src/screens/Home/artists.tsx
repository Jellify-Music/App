import React from 'react'
import Artists from '../../components/Artists/component'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useRecentArtists } from '../../api/queries/recents'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'
import { HomeNavigator, useNavigation } from '@react-navigation/native'

export default function HomeArtistsScreen({
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const navigation = useNavigation<HomeNavigator>()

	const recentArtistsInfiniteQuery = useRecentArtists()
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	if (navigation.getState().routeNames.pop() === 'MostPlayedArtists') {
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
