import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../Home'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SettingsScreen from '../Settings'
import { Discover } from '../Discover'
import { useTheme, YStack } from 'tamagui'
import SearchStack from '../Search'
import LibraryScreen from '../Library'
import TabParamList from './types'
import { TabProps } from '../types'
import TabBar from './tab-bar'
import { Platform } from 'react-native'
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'

const Tab = createNativeBottomTabNavigator<TabParamList>()

export default function Tabs({ route, navigation }: TabProps): React.JSX.Element {
	const theme = useTheme()

	const activeJellyfishIcon = MaterialDesignIcons.getImageSourceSync('jellyfish')!
	const inactiveJellyfishIcon = MaterialDesignIcons.getImageSourceSync('jellyfish-outline')!

	const activeLibraryIcon = MaterialDesignIcons.getImageSourceSync('music-box-multiple')!
	const inactiveLibraryIcon = MaterialDesignIcons.getImageSourceSync(
		'music-box-multiple-outline',
	)!

	const searchIcon = MaterialDesignIcons.getImageSourceSync('magnify', 24, theme.primary.val)!

	const activeDiscoverIcon = MaterialDesignIcons.getImageSourceSync('compass')!
	const inactiveDiscoverIcon = MaterialDesignIcons.getImageSourceSync('compass-outline')!

	const settingsIcon = MaterialDesignIcons.getImageSourceSync('cogs')!

	return (
		<>
			<TabBar />

			<Tab.Navigator
				initialRouteName={route.params?.screen ?? 'HomeTab'}
				screenOptions={{
					tabBarActiveTintColor: theme.primary.val,
					lazy: true,
				}}
			>
				<Tab.Screen
					name='HomeTab'
					component={Home}
					options={{
						title: 'Home',
						tabBarIcon: ({ focused }) =>
							focused ? activeJellyfishIcon : inactiveJellyfishIcon,
						tabBarButtonTestID: 'home-tab-button',
					}}
				/>

				<Tab.Screen
					name='LibraryTab'
					component={LibraryScreen}
					options={{
						title: 'Library',
						tabBarIcon: ({ focused }) =>
							focused ? activeLibraryIcon : inactiveLibraryIcon,
						tabBarButtonTestID: 'library-tab-button',
					}}
				/>

				<Tab.Screen
					name='SearchTab'
					component={SearchStack}
					options={{
						title: 'Search',
						tabBarIcon: () => searchIcon,
						tabBarButtonTestID: 'search-tab-button',
					}}
				/>

				<Tab.Screen
					name='DiscoverTab'
					component={Discover}
					options={{
						title: 'Discover',
						tabBarIcon: ({ focused }) =>
							focused ? activeDiscoverIcon : inactiveDiscoverIcon,
						tabBarButtonTestID: 'discover-tab-button',
					}}
				/>

				<Tab.Screen
					name='SettingsTab'
					component={SettingsScreen}
					options={{
						title: 'Settings',
						tabBarIcon: () => settingsIcon,
						tabBarButtonTestID: 'settings-tab-button',
					}}
				/>
			</Tab.Navigator>
		</>
	)
}
