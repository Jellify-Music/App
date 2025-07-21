import React, { useState } from 'react'
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Home from './Home'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import SettingsScreen from './Settings'
import { Discover } from './Discover'
import { Miniplayer } from '../components/Player/mini-player'
import { Separator, useTheme } from 'tamagui'
import { usePlayerContext } from '../providers/Player'
import SearchStack from './Search'
import LibraryStack from './Library'
import InternetConnectionWatcher from '../components/Network/internetConnectionWatcher'
import { StackParamList } from '../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

const Tab = createBottomTabNavigator()

export function Tabs({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const [playerVisible, setPlayerVisible] = useState(false)
	const theme = useTheme()
	const { nowPlaying } = usePlayerContext()

	navigation.addListener('focus', () => {
		setPlayerVisible(false)
	})

	navigation.addListener('blur', () => {
		setPlayerVisible(true)
	})

	return (
		<Tab.Navigator
			initialRouteName='Home'
			screenOptions={{
				animation: 'shift',
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.neutral.val,
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
						<MaterialCommunityIcons
							name='jellyfish-outline'
							color={color}
							size={size}
							testID='home-tab-icon'
						/>
					),
				}}
			/>

			<Tab.Screen
				name='Library'
				component={LibraryStack}
				options={{
					lazy: false,
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name='music-box-multiple'
							color={color}
							size={size}
							testID='library-tab-icon'
						/>
					),
				}}
			/>

			<Tab.Screen
				name='Search'
				component={SearchStack}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name='magnify'
							color={color}
							size={size}
							testID='search-tab-icon'
						/>
					),
				}}
			/>

			<Tab.Screen
				name='Discover'
				component={Discover}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name='earth'
							color={color}
							size={size}
							testID='discover-tab-icon'
						/>
					),
				}}
			/>

			<Tab.Screen
				name='Settings'
				component={SettingsScreen}
				options={{
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name='dip-switch'
							color={color}
							size={size}
							testID='settings-tab-icon'
						/>
					),
				}}
			/>
		</Tab.Navigator>
	)
}
