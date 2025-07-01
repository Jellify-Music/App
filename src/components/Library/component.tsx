import { StackParamList } from '../types'
import { RouteProp } from '@react-navigation/native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsTab from './components/playlists-tab'
import { getToken, useTheme } from 'tamagui'
import { useColorScheme } from 'react-native'
import Icon from '../Global/components/icon'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'
import LibraryTabBar from './tab-bar'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

const LibraryTabsNavigator = createMaterialTopTabNavigator()

export default function Library({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'LibraryScreen'>
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const isDarkMode = useColorScheme() === 'dark'
	const theme = useTheme()

	return (
		<LibraryTabsNavigator.Navigator
			tabBar={(props) => <LibraryTabBar {...props} />}
			screenOptions={{
				tabBarShowIcon: true,
				tabBarItemStyle: {
					height: getToken('$12') + getToken('$6'),
				},
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.neutral.val,
				tabBarLabelStyle: {
					fontFamily: 'Figtree-Bold',
				},
			}}
		>
			<LibraryTabsNavigator.Screen
				name='Artists'
				component={ArtistsTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='microphone-variant'
							color={focused ? '$primary' : '$neutral'}
							small
						/>
					),
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Albums'
				component={AlbumsTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='music-box-multiple'
							color={focused ? '$primary' : '$neutral'}
							small
						/>
					),
				}}
				initialParams={{ navigation }}
			/>

			<LibraryTabsNavigator.Screen
				name='Tracks'
				component={TracksTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='music-clef-treble'
							color={focused ? '$primary' : '$neutral'}
							small
						/>
					),
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Playlists'
				component={PlaylistsTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='playlist-music'
							color={focused ? '$primary' : '$neutral'}
							small
						/>
					),
				}}
				initialParams={{ navigation }}
			/>
		</LibraryTabsNavigator.Navigator>
	)
}
