import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { UseInfiniteQueryResult } from '@tanstack/react-query'

type DiscoverStackParamList = BaseStackParamList & {
	Discover: undefined
	RecentlyAdded: {
		albums: BaseItemDto[] | undefined
		navigation: NativeStackNavigationProp<RootStackParamList>
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
		isFetchingNextPage: boolean
	}
	PublicPlaylists: {
		playlists: BaseItemDto[] | undefined
		navigation: NativeStackNavigationProp<RootStackParamList>
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
		isFetchingNextPage: boolean
		refetch: () => void
	}
	SuggestedArtists: {
		artistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
		navigation: NativeStackNavigationProp<RootStackParamList>
	}
}

export default DiscoverStackParamList

export type RecentlyAddedProps = NativeStackScreenProps<DiscoverStackParamList, 'RecentlyAdded'>
export type PublicPlaylistsProps = NativeStackScreenProps<DiscoverStackParamList, 'PublicPlaylists'>
export type SuggestedArtistsProps = NativeStackScreenProps<
	DiscoverStackParamList,
	'SuggestedArtists'
>
