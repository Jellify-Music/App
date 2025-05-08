import { StackParamList } from '../../components/types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsScreen from '../Playlists/screen'
import { getToken } from 'tamagui'
import { useColorScheme } from 'react-native'
import Icon from '../Global/helpers/icon'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'

const LibraryTabsNavigator = createMaterialTopTabNavigator()

export default function Library({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'Library'>
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const isDarkMode = useColorScheme() === 'dark'

	return (
		<LibraryTabsNavigator.Navigator
			screenOptions={{
				tabBarShowIcon: true,
				tabBarActiveTintColor: getToken('$color.telemagenta'),
				tabBarInactiveTintColor: isDarkMode
					? getToken('$color.amethyst')
					: getToken('$color.purpleGray'),
				tabBarLabelStyle: {
					fontFamily: 'Aileron-Bold',
				},
			}}
		>
			<LibraryTabsNavigator.Screen
				name='Artists'
				component={ArtistsTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon name='microphone-variant' color={color} small />
					),
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Albums'
				component={AlbumsTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon name='music-box-multiple' color={color} small />
					),
				}}
				initialParams={{ navigation }}
			/>

			<LibraryTabsNavigator.Screen
				name='Tracks'
				component={TracksTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon name='music-clef-treble' color={color} small />
					),
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Playlists'
				component={PlaylistsScreen}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon name='playlist-music' color={color} small />
					),
				}}
				initialParams={{ navigation }}
			/>
		</LibraryTabsNavigator.Navigator>
	)
}
