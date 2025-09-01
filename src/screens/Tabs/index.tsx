import React from 'react'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../Home'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SettingsScreen from '../Settings'
import { Discover } from '../Discover'
import { Miniplayer } from '../../components/Player/mini-player'
import { useTheme } from 'tamagui'
import { useNowPlaying } from '../../providers/Player/hooks/queries'
import SearchStack from '../Search'
import LibraryScreen from '../Library'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import TabParamList from './types'
import { TabProps } from '../types'
import { Platform } from 'react-native'

const Tab = createBottomTabNavigator<TabParamList>()

export default function Tabs({ route, navigation }: TabProps): React.JSX.Element {
	const theme = useTheme()
	const { data: nowPlaying } = useNowPlaying()

	return (
		<Tab.Navigator
			initialRouteName={route.params?.screen ?? 'HomeTab'}
			screenOptions={{
				animation: 'shift',
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.neutral.val,
				lazy: true,
			}}
			tabBar={(props) => (
				<>
					{nowPlaying && (
						/* Hide miniplayer if the queue is empty */
						<Miniplayer />
					)}
					<InternetConnectionWatcher />

					<BottomTabBar {...props} />
				</>
			)}
		>
			<Tab.Screen
				name='HomeTab'
				component={Home}
				options={{
					title: 'Home',
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='jellyfish-outline' color={color} size={size} />
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
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='music-box-multiple' color={color} size={size} />
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
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='earth' color={color} size={size} />
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
						<MaterialDesignIcons name='dip-switch' color={color} size={size} />
					),
					tabBarButtonTestID: 'settings-tab-button',
				}}
			/>
		</Tab.Navigator>
	)
}
