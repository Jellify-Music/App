import { StackParamList } from '../types'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsTab from './components/playlists-tab'
import { getToken, useTheme } from 'tamagui'
import Icon from '../Global/components/icon'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'
import LibraryTabBar from './tab-bar'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

const LibraryTabsNavigator = createMaterialTopTabNavigator()

export default function Library({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
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
					tabBarButtonTestID: 'library-artists-tab-button',
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
					tabBarButtonTestID: 'library-albums-tab-button',
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
					tabBarButtonTestID: 'library-tracks-tab-button',
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
					tabBarButtonTestID: 'library-playlists-tab-button',
				}}
				initialParams={{ navigation }}
			/>
		</LibraryTabsNavigator.Navigator>
	)
}
