import { StaticParamList, StaticScreenProps } from '@react-navigation/native'
import type DiscoverStack from '.'

export enum DiscoverAlbumScreenType {
	RecentlyAdded = 'RecentlyAdded',
	Suggested = 'Suggested',
}

export type DiscoverStackNavigator = typeof DiscoverStack

type DiscoverStackParamList = StaticParamList<DiscoverStackNavigator>

export default DiscoverStackParamList

export type DiscoverAlbumsProps = StaticScreenProps<{
	type: DiscoverAlbumScreenType
}>
export type PublicPlaylistsProps = StaticScreenProps<undefined>
export type SuggestedArtistsProps = StaticScreenProps<undefined>
