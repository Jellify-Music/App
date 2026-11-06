import React from 'react'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useRecentArtists } from '../../api/queries/recents'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'
import InfiniteItemList from '../../components/Global/components/Lists/item-list'

export default function HomeArtistsScreen({
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	const query =
		route.name === 'MostPlayedArtists'
			? frequentArtistsInfiniteQuery
			: recentArtistsInfiniteQuery

	return <InfiniteItemList infiniteQuery={query} />
}
