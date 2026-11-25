import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from '../navigation'
import { Home as HomeComponent } from '../../components/Home'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import RecentPlaylistsScreen from './playlists'
import HomeStackParamList from './types'
import { BaseStackScreens } from '../base-stack'
import i18n from '../../i18n'

const HomeStack = createNativeStackNavigator<HomeStackParamList>({
	initialRouteName: 'HomeScreen',
	screenOptions: stackScreenOptions,
	screens: {
		HomeScreen: {
			screen: HomeComponent,
			options: {
				title: i18n.t('navigation.home'),
			},
		},
		...BaseStackScreens,
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
	},
})

export default HomeStack
