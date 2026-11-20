import { RouteProp } from '@react-navigation/native'
import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import { BaseStackParamList } from './types'
import InstantMixScreen from './InstantMix'
import i18n from '../i18n'

export const BaseStackScreens = {
	Artist: {
		screen: ArtistScreen,
		options: {
			// the artist's image runs to the top of the screen, with its own back and favourite buttons
			headerShown: false,
		},
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
			title: route.params.album.Name ?? i18n.t('placeholders.untitledAlbum'),
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
			title: route.params.playlist.Name ?? i18n.t('placeholders.untitledPlaylist'),
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	InstantMix: {
		screen: InstantMixScreen,
		options: ({ route }: { route: RouteProp<BaseStackParamList, 'InstantMix'> }) => ({
			headerTitle: i18n.t('instantMix.title', {
				name:
					route.params.item.Name ??
					route.params.item.OriginalTitle ??
					i18n.t('placeholders.untitled'),
			}),
		}),
	},
	Tracks: {
		screen: TracksScreen,
		options: {
			title: i18n.t('navigation.tracks'),
		},
	},
}
