import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import InstantMix from '../components/InstantMix/component'
import { createNativeStackScreen } from '@react-navigation/native-stack'

export const BaseStack = {
	Artist: createNativeStackScreen({
		screen: ArtistScreen,
		options: ({ route, theme }) => ({
			title: route.params.artist.Name ?? 'Unknown Artist',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	Album: createNativeStackScreen({
		screen: AlbumScreen,
		options: ({ route, theme }) => ({
			title: route.params.album.Name ?? 'Untitled Album',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	Playlist: createNativeStackScreen({
		screen: PlaylistScreen,
		options: ({ route, theme }) => ({
			title: route.params.playlist.Name ?? 'Untitled Playlist',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	InstantMix: createNativeStackScreen({
		screen: InstantMix,
		options: ({ route }) => ({
			headerTitle: `${route.params.item.Name ?? route.params.item.OriginalTitle ?? 'Untitled'} Mix`,
		}),
	}),
	Tracks: createNativeStackScreen({
		screen: TracksScreen,
		options: {
			title: 'Tracks',
		},
	}),
}
