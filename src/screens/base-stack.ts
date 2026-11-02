import type {
	ParamListBase,
	StackNavigationState,
	StaticConfigScreens,
} from '@react-navigation/native'
import type {
	NativeStackNavigationEventMap,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
} from '@react-navigation/native-stack'
import AlbumScreen from './Album'
import ArtistScreen from './Artist'
import { PlaylistScreen } from './Playlist'
import TracksScreen from './Tracks'
import { BaseStackParamList } from './types'
import InstantMixScreen from './InstantMix'

/**
 * These screens are spread into every tab stack, so `route` is typed against
 * {@link BaseStackParamList} while `navigation` and `state` stay generic enough
 * to accept each host stack's own param list.
 */
type BaseStackScreenConfigs = StaticConfigScreens<
	BaseStackParamList,
	StackNavigationState<ParamListBase>,
	NativeStackNavigationOptions,
	NativeStackNavigationEventMap,
	{ [RouteName in keyof BaseStackParamList]: NativeStackNavigationProp<ParamListBase, RouteName> }
>

export const BaseStackScreens = {
	Artist: {
		screen: ArtistScreen,
		options: ({ route }) => ({
			title: route.params.artist.Name ?? 'Unknown Artist',
		}),
	},
	Album: {
		screen: AlbumScreen,
		options: ({ route, theme }) => ({
			title: route.params.album.Name ?? 'Untitled Album',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	Playlist: {
		screen: PlaylistScreen,
		options: ({ route, theme }) => ({
			title: route.params.playlist.Name ?? 'Untitled Playlist',
			headerTitleStyle: {
				color: theme.colors.background,
			},
		}),
	},
	InstantMix: {
		screen: InstantMixScreen,
		options: ({ route }) => ({
			headerTitle: `${route.params.item.Name ?? route.params.item.OriginalTitle ?? 'Untitled'} Mix`,
		}),
	},
	Tracks: {
		screen: TracksScreen,
		options: {
			title: 'Tracks',
		},
	},
} satisfies BaseStackScreenConfigs
