import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export enum DiscoverAlbumScreenType {
	RecentlyAdded = 'RecentlyAdded',
	Suggested = 'Suggested',
}

type DiscoverStackParamList = BaseStackParamList & {
	Discover: undefined
	Albums: {
		type: DiscoverAlbumScreenType
	}
	PublicPlaylists: {
		playlists: BaseItemDto[] | undefined
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
		isFetchingNextPage: boolean
		refetch: () => void
	}
	SuggestedArtists: undefined
}

export default DiscoverStackParamList

export type DiscoverAlbumsProps = NativeStackScreenProps<DiscoverStackParamList, 'Albums'>
export type PublicPlaylistsProps = NativeStackScreenProps<DiscoverStackParamList, 'PublicPlaylists'>
export type SuggestedArtistsProps = NativeStackScreenProps<
	DiscoverStackParamList,
	'SuggestedArtists'
>
