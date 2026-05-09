import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsTab from './components/playlists-tab'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'
import LibraryTabBar from './tab-bar'
import React from 'react'

const LibraryTabs = createMaterialTopTabNavigator({
	tabBar: (props) => <LibraryTabBar {...props} />,
	screenOptions: ({ theme }) => ({
		swipeEnabled: false, // Disable tab swiped to prevent conflicts with SwipeableRow gestures
		tabBarIndicatorStyle: {
			borderBottomWidth: 4,
			borderBottomColor: theme.colors.primary,
		},
		tabBarActiveTintColor: theme.colors.primary,
		tabBarInactiveTintColor: theme.colors.border,
		tabBarStyle: {
			backgroundColor: theme.colors.background,
		},
		tabBarLabelStyle: {
			fontSize: 16,
			fontFamily: 'Figtree-Bold',
		},
		tabBarPressOpacity: 0.5,
		lazy: true, // Enable lazy loading to prevent all tabs from mounting simultaneously
	}),
	screens: {
		Artists: {
			screen: ArtistsTab,
			options: {
				tabBarButtonTestID: 'library-artists-tab-button',
			},
		},
		Albums: {
			screen: AlbumsTab,
			options: {
				tabBarButtonTestID: 'library-albums-tab-button',
			},
		},
		Tracks: {
			screen: TracksTab,
			options: {
				tabBarButtonTestID: 'library-tracks-tab-button',
			},
		},
		Playlists: {
			screen: PlaylistsTab,
			options: {
				tabBarButtonTestID: 'library-playlists-tab-button',
			},
		},
	},
})

export default LibraryTabs
