import React from 'react'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useRecentArtists } from '../../api/queries/recents'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'
import ItemList from '../../components/Global/components/item-list'

export default function HomeArtistsScreen({
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	const query =
		route.name === 'MostPlayedArtists'
			? frequentArtistsInfiniteQuery
			: recentArtistsInfiniteQuery

	return <ItemList query={query} />
}
