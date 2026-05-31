import React from 'react'
import { createBottomTabNavigator, createBottomTabScreen } from '@react-navigation/bottom-tabs'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SearchStack from '../Search'
import TabBar from './tab-bar'
import SettingsStack from '../Settings'
import DiscoverStack from '../Discover'
import LibraryStack from '../Library'
import HomeStack from '../Home'

const Tabs = createBottomTabNavigator({
	initialRouteName: 'HomeTab',
	screenOptions: {
		animation: 'shift',
		lazy: true,
	},
	// tabBar: (props) => <TabBar {...props} />,
	screens: {
		HomeTab: createBottomTabScreen({
			screen: HomeStack,
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
		}),
		LibraryTab: createBottomTabScreen({
			screen: LibraryStack,
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
		}),
		SearchTab: createBottomTabScreen({
			screen: SearchStack,
			options: {
				title: 'Search',
				headerShown: false,
				tabBarIcon: ({ color, size }) => (
					<MaterialDesignIcons name='magnify' color={color} size={size} />
				),
				tabBarButtonTestID: 'search-tab-button',
			},
		}),
		DiscoverTab: createBottomTabScreen({
			screen: DiscoverStack,
			options: {
				title: 'Discover',
				headerShown: false,
				tabBarIcon: ({ color, size }) => (
					<MaterialDesignIcons name='radar' color={color} size={size} />
				),
				tabBarButtonTestID: 'discover-tab-button',
			},
		}),
		SettingsTab: createBottomTabScreen({
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
		}),
	},
})

export default Tabs
