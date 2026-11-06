import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

export enum DiscoverAlbumScreenType {
	RecentlyAdded = 'RecentlyAdded',
	Suggested = 'Suggested',
}

type DiscoverStackParamList = BaseStackParamList & {
	Discover: undefined
	Albums: {
		type: DiscoverAlbumScreenType
	}
	PublicPlaylists: undefined
	SuggestedArtists: undefined
}

export default DiscoverStackParamList

export type DiscoverAlbumsProps = NativeStackScreenProps<DiscoverStackParamList, 'Albums'>
export type PublicPlaylistsProps = NativeStackScreenProps<DiscoverStackParamList, 'PublicPlaylists'>
export type SuggestedArtistsProps = NativeStackScreenProps<
	DiscoverStackParamList,
	'SuggestedArtists'
>
