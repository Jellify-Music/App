import React from 'react'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from '../Home'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import SettingsScreen from '../Settings'
import { Discover } from '../Discover'
import { Miniplayer } from '../../components/Player/mini-player'
import { useTheme } from 'tamagui'
import { useNowPlayingContext } from '../../providers/Player'
import SearchStack from '../Search'
import LibraryStack from '../Library'
import InternetConnectionWatcher from '../../components/Network/internetConnectionWatcher'
import { Platform } from 'react-native'
import TabParamList from './types'

const Tab = createBottomTabNavigator<TabParamList>()

export function Tabs(): React.JSX.Element {
	const theme = useTheme()
	const nowPlaying = useNowPlayingContext()

	return (
		<Tab.Navigator
			initialRouteName='Home'
			screenOptions={{
				animation: 'shift',
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.neutral.val,
				lazy: Platform.OS === 'ios',
			}}
			tabBar={(props) => (
				<>
					{nowPlaying && (
						/* Hide miniplayer if the queue is empty */
						<Miniplayer navigation={props.navigation} />
					)}
					<InternetConnectionWatcher />

					<BottomTabBar {...props} />
				</>
			)}
		>
			<Tab.Screen
				name='Home'
				component={Home}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='jellyfish-outline' color={color} size={size} />
					),
					tabBarButtonTestID: 'home-tab-button',
				}}
			/>

			<Tab.Screen
				name='Library'
				component={LibraryStack}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='music-box-multiple' color={color} size={size} />
					),
					tabBarButtonTestID: 'library-tab-button',
				}}
			/>

			<Tab.Screen
				name='Search'
				component={SearchStack}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='magnify' color={color} size={size} />
					),
					tabBarButtonTestID: 'search-tab-button',
				}}
			/>

			<Tab.Screen
				name='Discover'
				component={Discover}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialDesignIcons name='earth' color={color} size={size} />
					),
					tabBarButtonTestID: 'discover-tab-button',
				}}
			/>

			<Tab.Screen
				name='Settings'
				component={SettingsScreen}
				options={{
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
