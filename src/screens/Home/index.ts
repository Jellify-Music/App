import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { stackScreenOptions } from '../navigation'
import { Home as HomeComponent } from '../../components/Home'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import HomeStackParamList from './types'
import { BaseStackScreens } from '../base-stack'
import { holidayHeaderOptions } from '../../components/Holidays/header-options'

const HomeStack = createNativeStackNavigator<HomeStackParamList>({
	initialRouteName: 'HomeScreen',
	screenOptions: stackScreenOptions,
	screens: {
		HomeScreen: {
			screen: HomeComponent,
			options: () => ({
				title: 'Home',
				...holidayHeaderOptions({ icon: 'holly', snow: { count: 26, seed: 11 } }),
			}),
		},
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
