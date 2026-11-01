import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import PlaylistsTab from './components/playlists-tab'
import TracksTab from './components/tracks-tab'
import ArtistsTab from './components/artists-tab'
import AlbumsTab from './components/albums-tab'
import LibraryTabBar from './tab-bar'
import React from 'react'
import { PRESET_PALETTES } from '../../configs/tamagui.config'
import { useAppSettingsStore } from '../../stores/settings/app'

const LibraryTabs = createMaterialTopTabNavigator({
	tabBar: (props) => <LibraryTabBar {...props} />,
	screenOptions: ({ theme }) => {
		const preset = useAppSettingsStore.getState().colorPreset
		const isHolidays = preset === 'holidays'

		return {
			swipeEnabled: false, // Disable tab swiped to prevent conflicts with SwipeableRow gestures
			tabBarIndicatorStyle: {
				borderBottomWidth: 4,
				// Holidays draws its own candy cane indicator (see the tab bar)
				borderBottomColor: isHolidays ? 'transparent' : theme.colors.primary,
				...(isHolidays && { backgroundColor: 'transparent' }),
			},
			tabBarActiveTintColor: theme.colors.primary,
			// The muted text color, which is the border color in every preset but Holidays
			tabBarInactiveTintColor:
				PRESET_PALETTES[preset][theme.dark ? 'dark' : 'light'].borderColor,
			tabBarStyle: {
				backgroundColor: theme.colors.background,
				...(isHolidays && { height: 48, elevation: 0, shadowOpacity: 0 }),
			},
			tabBarLabelStyle: {
				fontSize: isHolidays ? 16.5 : 14,
				fontFamily: 'Figtree-Bold',
				...(isHolidays && { textTransform: 'none' as const }),
			},
			tabBarPressOpacity: 0.5,
			lazy: true, // Enable lazy loading to prevent all tabs from mounting simultaneously
		}
	},
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
