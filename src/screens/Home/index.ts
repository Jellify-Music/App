import { createNativeStackNavigator, createNativeStackScreen } from '@react-navigation/native-stack'
import { Home as HomeComponent } from '../../components/Home'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import RecentPlaylistsScreen from './playlists'
import { BaseStack } from '../base-stack'
import { stackScreenOptions } from '../navigation'
import i18n from '../../i18n'

const HomeStack = createNativeStackNavigator({
	initialRouteName: 'HomeScreen',
	screenOptions: stackScreenOptions,
	screens: {
		HomeScreen: createNativeStackScreen({
			screen: HomeComponent,
			options: {
				title: i18n.t('navigation.home'),
			},
		}),
		RecentArtists: {
			screen: HomeArtistsScreen,
			options: {
				title: i18n.t('home.recentArtists'),
			},
		},
		MostPlayedArtists: {
			screen: HomeArtistsScreen,
			options: {
				title: i18n.t('home.mostPlayed'),
			},
		},
		RecentTracks: {
			screen: HomeTracksScreen,
			options: {
				title: i18n.t('home.recentlyPlayed'),
			},
		},
		MostPlayedTracks: {
			screen: HomeTracksScreen,
			options: {
				title: i18n.t('home.onRepeat'),
			},
		},
		RecentPlaylists: {
			screen: RecentPlaylistsScreen,
			options: {
				title: i18n.t('home.yourPlaylists'),
			},
		},
		...BaseStack,
	},
})

export default HomeStack
