import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import InstantMix from '../components/InstantMix/component'
import { AlbumProps, ArtistProps, InstantMixProps, PlaylistProps } from './types'
import { createNativeStackScreen } from '@react-navigation/native-stack'
import { StaticParamList } from '@react-navigation/native'

export const BaseStackScreens = {
	Artist: createNativeStackScreen({
		screen: ArtistScreen,
		options: ({ route }: ArtistProps) => ({
			title: route.params.artist.Name ?? 'Unknown Artist',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	}),
	Album: createNativeStackScreen({
		screen: AlbumScreen,
		options: ({ route }: AlbumProps) => ({
			title: route.params.album.Name ?? 'Untitled Album',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	}),
	Playlist: createNativeStackScreen({
		screen: PlaylistScreen,
		options: ({ route }: PlaylistProps) => ({
			title: route.params.playlist.Name ?? 'Untitled Playlist',
			headerTitleStyle: {
				color: 'transparent',
			},
		}),
	}),
	InstantMix: createNativeStackScreen({
		screen: InstantMix,
		options: ({ route }: InstantMixProps) => ({
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

export type BaseStackScreen = typeof BaseStackScreens
