import React from 'react'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'
import InfiniteItemList from '../../components/Global/components/Lists/item-list'

export default function HomeArtistsScreen({
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	const query = frequentArtistsInfiniteQuery

	return <InfiniteItemList infiniteQuery={query} />
}
