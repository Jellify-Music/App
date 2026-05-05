import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PlaylistScreen } from '../Playlist'
import { Home as HomeComponent } from '../../components/Home'
import ArtistScreen from '../Artist'
import { getTokenValue } from 'tamagui'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import AlbumScreen from '../Album'
import HomeStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/formatting/item-names'
import TracksScreen from '../Tracks'

const HomeStack = createNativeStackNavigator<HomeStackParamList>({
	initialRouteName: 'HomeScreen',
	screens: {
		HomeScreen: {
			screen: HomeComponent,
			options: {
				title: 'Home',
				headerTitleAlign: 'center',
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
					fontSize: getTokenValue('$6'),
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
		RecentArtists: {
			screen: HomeArtistsScreen,
			options: {
				title: 'Recent Artists',
			},
		},
		MostPlayedArtists: {
			screen: HomeArtistsScreen,
			options: {
				title: 'Most Played',
			},
		},
		RecentTracks: {
			screen: HomeTracksScreen,
			options: {
				title: 'Recently Played',
			},
		},
		MostPlayedTracks: {
			screen: HomeTracksScreen,
			options: {
				title: 'On Repeat',
			},
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
			options: {
				headerShown: false,
				headerTitleStyle: {
					color: 'transparent',
				},
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
				title: 'Tracks',
			},
		},
	},
})

export default HomeStack
