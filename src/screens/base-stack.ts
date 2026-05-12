import { RouteProp } from '@react-navigation/native'
import { getItemName } from '../utils/formatting/item-names'
import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import InstantMix from '../components/InstantMix/component'
import { BaseStackParamList } from './types'

export const BaseStackScreens = {
	Artist: {
		screen: ArtistScreen,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'Artist'> }) => ({
			title: route.params.artist.Name ?? 'Unknown Artist',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	},
	Album: {
		screen: AlbumScreen,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'Album'> }) => ({
			title: route.params.album.Name ?? 'Untitled Album',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	},
	Playlist: {
		screen: PlaylistScreen,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'Playlist'> }) => ({
			title: route.params.playlist.Name ?? 'Untitled Playlist',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	},
	InstantMix: {
		screen: InstantMix,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'InstantMix'> }) => ({
			headerTitle: `${getItemName(route.params.item)} Mix`,
		}),
	},
	Tracks: {
		screen: TracksScreen,
		options: {
			title: 'Tracks',
		},
	},
}
