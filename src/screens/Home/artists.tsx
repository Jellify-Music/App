import React from 'react'
import { MostPlayedArtistsProps, RecentArtistsProps } from './types'
import { useRecentArtists } from '../../api/queries/recents'
import { useFrequentlyPlayedArtists } from '../../api/queries/frequents'
import { useNavigationState } from '@react-navigation/native'
import ItemList from '../../components/Global/components/item-list'
import { HomeNavigator } from '@react-navigation/native'

export default function HomeArtistsScreen({
	route,
}: RecentArtistsProps | MostPlayedArtistsProps): React.JSX.Element {
	const recentArtistsInfiniteQuery = useRecentArtists()
	const frequentArtistsInfiniteQuery = useFrequentlyPlayedArtists()

	const query = frequentArtistsInfiniteQuery

	return <ItemList query={query} />
}
