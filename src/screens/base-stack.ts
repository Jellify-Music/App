import { RouteProp } from '@react-navigation/native'
import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import { BaseStackParamList } from './types'
import InstantMixScreen from './InstantMix'

export const BaseStackScreens = {
	Artist: {
		screen: ArtistScreen,
		options: ({
			route,
			theme,
		}: {
			route: RouteProp<BaseStackParamList, 'Artist'>
			theme: ReactNavigation.Theme
		}) => ({
			title: route.params.artist.Name ?? 'Unknown Artist',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	Album: {
		screen: AlbumScreen,
		options: ({
			route,
			theme,
		}: {
			route: RouteProp<BaseStackParamList, 'Album'>
			theme: ReactNavigation.Theme
		}) => ({
			title: route.params.album.Name ?? 'Untitled Album',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	Playlist: {
		screen: PlaylistScreen,
		options: ({
			route,
			theme,
		}: {
			route: RouteProp<BaseStackParamList, 'Playlist'>
			theme: ReactNavigation.Theme
		}) => ({
			title: route.params.playlist.Name ?? 'Untitled Playlist',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	InstantMix: {
		screen: InstantMixScreen,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'InstantMix'> }) => ({
			headerTitle: `${route.params.item.Name ?? route.params.item.OriginalTitle ?? 'Untitled'} Mix`,
		}),
	},
	Tracks: {
		screen: TracksScreen,
		options: {
			title: 'Tracks',
		},
	},
}
