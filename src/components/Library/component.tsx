import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsTab from './components/playlists-tab'
import { getToken, getTokenValue, useTheme } from 'tamagui'
import Icon from '../Global/components/icon'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'
import LibraryTabBar from './tab-bar'
import { LibraryScreenProps } from '../../screens/Library/types'
import React from 'react'

const LibraryTabsNavigator = createMaterialTopTabNavigator()

export default function LibraryScreen({
	route,
	navigation,
}: LibraryScreenProps): React.JSX.Element {
	const theme = useTheme()

	return (
		<LibraryTabsNavigator.Navigator
			tabBar={(props) => <LibraryTabBar {...props} />}
			screenOptions={{
				swipeEnabled: false, // Disable tab swiping to prevent conflicts with SwipeableRow gestures
				tabBarIndicatorStyle: {
					borderColor: theme.background.val,
					borderBottomWidth: getTokenValue('$2'),
				},
				tabBarActiveTintColor: theme.background.val,
				tabBarInactiveTintColor: theme.background50.val,
				tabBarStyle: {
					backgroundColor: theme.primary.val,
				},
				tabBarLabelStyle: {
					fontSize: 16,
					fontFamily: 'Figtree-Bold',
				},
				tabBarPressOpacity: 0.5,
				lazy: true, // Enable lazy loading to prevent all tabs from mounting simultaneously
			}}
		>
			<LibraryTabsNavigator.Screen
				name='Artists'
				component={ArtistsTab}
				options={{
					tabBarButtonTestID: 'library-artists-tab-button',
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Albums'
				component={AlbumsTab}
				options={{
					tabBarButtonTestID: 'library-albums-tab-button',
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Tracks'
				component={TracksTab}
				options={{
					tabBarButtonTestID: 'library-tracks-tab-button',
				}}
			/>

			<LibraryTabsNavigator.Screen
				name='Playlists'
				component={PlaylistsTab}
				options={{
					tabBarButtonTestID: 'library-playlists-tab-button',
				}}
			/>
		</LibraryTabsNavigator.Navigator>
	)
}
