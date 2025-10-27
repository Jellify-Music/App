import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../Home'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SettingsScreen from '../Settings'
import { Discover } from '../Discover'
import { useTheme } from 'tamagui'
import SearchStack from '../Search'
import LibraryScreen from '../Library'
import TabParamList from './types'
import { TabProps } from '../types'
import TabBar from './tab-bar'
import { Platform } from 'react-native'

const Tab = createBottomTabNavigator<TabParamList>()

export default function Tabs({ route, navigation }: TabProps): React.JSX.Element {
	const theme = useTheme()

	return (
		<Tab.Navigator
			/*
			 * https://github.com/react-navigation/react-navigation/issues/12755
			 */
			detachInactiveScreens={Platform.OS !== 'ios'}
			initialRouteName={route.params?.screen ?? 'HomeTab'}
			screenOptions={{
				animation: 'shift',
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.neutral.val,
				lazy: true,
			}}
			tabBar={(props) => <TabBar {...props} />}
		>
			<Tab.Screen
				name='HomeTab'
				component={Home}
				options={{
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
				}}
			/>

			<Tab.Screen
				name='LibraryTab'
				component={LibraryScreen}
				options={{
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
				}}
			/>

			<Tab.Screen
				name='SearchTab'
				component={SearchStack}
				options={{
					title: 'Search',
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='magnify' color={color} size={size} />
					),
					tabBarButtonTestID: 'search-tab-button',
				}}
			/>

			<Tab.Screen
				name='DiscoverTab'
				component={Discover}
				options={{
					title: 'Discover',
					headerShown: false,
					tabBarIcon: ({ color, size, focused }) => (
						<MaterialDesignIcons
							name={`compass${!focused ? '-outline' : ''}`}
							color={color}
							size={size}
						/>
					),
					tabBarButtonTestID: 'discover-tab-button',
				}}
			/>

			<Tab.Screen
				name='SettingsTab'
				component={SettingsScreen}
				options={{
					title: 'Settings',
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='cogs' color={color} size={size} />
					),
					tabBarButtonTestID: 'settings-tab-button',
				}}
			/>
		</Tab.Navigator>
	)
}
