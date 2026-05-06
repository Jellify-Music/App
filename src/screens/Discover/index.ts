import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Index from '../../components/Discover/component'
import AlbumScreen from '../Album'
import ArtistScreen from '../Artist'
import DiscoverAlbums from './albums'
import PublicPlaylists from './playlists'
import { PlaylistScreen } from '../Playlist'
import SuggestedArtists from './artists'
import DiscoverStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/formatting/item-names'
import TracksScreen from '../Tracks'

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>({
	initialRouteName: 'Discover',
	screens: {
		Discover: {
			screen: Index,
			options: {
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			},
		},
		Artist: {
			screen: ArtistScreen,
			options: ({ route }) => ({
				title: route.params.artist.Name ?? 'Unknown Artist',
				headerTitleStyle: {
					color: 'transparent',
				},
			}),
		},
		Album: {
			screen: AlbumScreen,
			options: ({ route }) => ({
				title: route.params.album.Name ?? 'Untitled Album',
				headerTitleStyle: {
					color: 'transparent',
				},
			}),
		},
		Playlist: {
			screen: PlaylistScreen,
			options: ({ route }) => ({
				title: route.params.playlist.Name ?? 'Untitled Playlist',
				headerTitleStyle: {
					color: 'transparent',
				},
			}),
		},
		Albums: {
			screen: DiscoverAlbums,
			options: {
				title: 'More from the Vault',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			},
		},
		PublicPlaylists: {
			screen: PublicPlaylists,
			options: {
				title: 'Public Playlists',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
					color: 'transparent',
				},
			},
		},
		SuggestedArtists: {
			screen: SuggestedArtists,
			options: {
				title: 'Artists for You',
			},
		},
		InstantMix: {
			screen: InstantMix,
			options: ({ route }) => ({
				headerTitle: `${getItemName(route.params.item)} Mix`,
			}),
		},
		Tracks: {
			screen: TracksScreen,
			options: {
				headerShown: false,
				title: 'Tracks',
			},
		},
	},
})

export default DiscoverStack
