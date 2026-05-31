import { createNativeStackNavigator, createNativeStackScreen } from '@react-navigation/native-stack'
import { Home as HomeComponent } from '../../components/Home'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import { BaseStackScreens } from '../base-stack'

const HomeStack = createNativeStackNavigator({
	initialRouteName: 'HomeScreen',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
		},
	},
	screens: {
		HomeScreen: createNativeStackScreen({
			screen: HomeComponent,
			options: {
				title: 'Home',
			},
		}),
		...BaseStackScreens,
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
	},
})

export default HomeStack
