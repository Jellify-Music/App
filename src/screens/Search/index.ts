import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ArtistScreen from '../Artist'
import AlbumScreen from '../Album'
import { PlaylistScreen } from '../Playlist'
import Search from '../../components/Search'
import SearchParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/formatting/item-names'
import TracksScreen from '../Tracks'

const SearchStack = createNativeStackNavigator<SearchParamList>({
	initialRouteName: 'SearchScreen',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
		},
	},
	screens: {
		SearchScreen: {
			screen: Search,
			options: {
				title: 'Search',
			},
		},
		Artist: {
			screen: ArtistScreen,
			options: ({ route }) => ({
				title: route.params.artist.Name ?? 'Unknown Artist',
			}),
		},
		Album: {
			screen: AlbumScreen,
			options: ({ route }) => ({
				title: route.params.album.Name ?? 'Untitled Album',
			}),
		},
		Playlist: {
			screen: PlaylistScreen,
			options: ({ route }) => ({
				title: route.params.playlist.Name ?? 'Untitled Playlist',
			}),
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
				title: 'Tracks',
			},
		},
	},
})

export default SearchStack
