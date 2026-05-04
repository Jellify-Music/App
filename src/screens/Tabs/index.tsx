import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../Home'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SearchStack from '../Search'
import LibraryScreen from '../Library'
import TabBar from './tab-bar'
import { Platform } from 'react-native'
import SettingsStack from '../Settings'
import DiscoverStack from '../Discover'

const Tabs = createBottomTabNavigator({
	initialRouteName: 'HomeTab',
	screenOptions: {
		animation: 'shift',
		lazy: true,
	},
	detachInactiveScreens: Platform.OS !== 'ios',
	tabBar: (props) => <TabBar {...props} />,
	screens: {
		HomeTab: {
			screen: Home,
			options: {
				title: 'Home',
				headerShown: false,
				tabBarIcon: ({ color, size, focused }) => (
					<MaterialDesignIcons
						name={`jellyfish${!focused ? '-outline' : ''}`}
						color={color}
						size={size}
					/>
				),
				tabBarButtonTestID: 'home-tab-button',
			},
		},
		LibraryTab: {
			screen: LibraryScreen,
			options: {
				title: 'Library',
				headerShown: false,
				tabBarIcon: ({ color, size, focused }) => (
					<MaterialDesignIcons
						name={`music-box-multiple${!focused ? '-outline' : ''}`}
						color={color}
						size={size}
					/>
				),
				tabBarButtonTestID: 'library-tab-button',
			},
		},
		SearchTab: {
			screen: SearchStack,
			options: {
				title: 'Search',
				headerShown: false,
				tabBarIcon: ({ color, size }) => (
					<MaterialDesignIcons name='magnify' color={color} size={size} />
				),
				tabBarButtonTestID: 'search-tab-button',
			},
		},
		DiscoverTab: {
			screen: DiscoverStack,
			options: {
				title: 'Discover',
				headerShown: false,
				tabBarIcon: ({ color, size }) => (
					<MaterialDesignIcons name='radar' color={color} size={size} />
				),
				tabBarButtonTestID: 'discover-tab-button',
			},
		},
		SettingsTab: {
			screen: SettingsStack,
			options: {
				title: 'Settings',
				headerShown: false,
				tabBarIcon: ({ color, size, focused }) => (
					<MaterialDesignIcons
						name={`cog${!focused ? '-outline' : ''}`}
						color={color}
						size={size}
					/>
				),
				tabBarButtonTestID: 'settings-tab-button',
			},
		},
	},
})

export default Tabs
