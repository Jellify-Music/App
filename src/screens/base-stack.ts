import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import InstantMixScreen from './InstantMix'
import { createNativeStackScreen } from '@react-navigation/native-stack'
import i18n from '../i18n'

export const BaseStack = {
	Artist: createNativeStackScreen({
		screen: ArtistScreen,
		options: ({ route, theme }) => ({
			title: route.params.artist.Name ?? i18n.t('placeholders.unknownArtist'),
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	Album: createNativeStackScreen({
		screen: AlbumScreen,
		options: ({ route, theme }) => ({
			title: route.params.album.Name ?? i18n.t('placeholders.untitledAlbum'),
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	Playlist: createNativeStackScreen({
		screen: PlaylistScreen,
		options: ({ route, theme }) => ({
			title: route.params.playlist.Name ?? i18n.t('placeholders.untitledPlaylist'),
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	}),
	InstantMix: createNativeStackScreen({
		screen: InstantMixScreen,
		options: ({ route }) => ({
			headerTitle: i18n.t('instantMix.title', {
				name:
					route.params.item.Name ??
					route.params.item.OriginalTitle ??
					i18n.t('placeholders.untitled'),
			}),
		}),
	}),
	Tracks: createNativeStackScreen({
		screen: TracksScreen,
		options: {
			title: i18n.t('navigation.tracks'),
		},
	}),
}
