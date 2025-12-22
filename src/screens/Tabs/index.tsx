import React from 'react'
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation'
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

const Tab = createNativeBottomTabNavigator<TabParamList>()

export default function Tabs({ route, navigation }: TabProps): React.JSX.Element {
	const theme = useTheme()

	const jellyfishIconUnfocused = MaterialDesignIcons.getImageSourceSync(
		'jellyfish-outline',
		24,
		theme.borderColor.val,
	)

	const jellyfishIconFocused = MaterialDesignIcons.getImageSourceSync(
		'jellyfish',
		24,
		theme.primary.val,
	)

	const libraryIconUnfocused = MaterialDesignIcons.getImageSourceSync(
		'music-box-multiple-outline',
		24,
		theme.borderColor.val,
	)

	const libraryIconFocused = MaterialDesignIcons.getImageSourceSync(
		'music-box-multiple',
		24,
		theme.primary.val,
	)

	const searchIconUnfocused = MaterialDesignIcons.getImageSourceSync(
		'magnify',
		24,
		theme.borderColor.val,
	)

	const searchIconFocused = MaterialDesignIcons.getImageSourceSync(
		'magnify',
		24,
		theme.primary.val,
	)

	const discoverIconUnfocused = MaterialDesignIcons.getImageSourceSync(
		'compass-outline',
		24,
		theme.borderColor.val,
	)

	const discoverIconFocused = MaterialDesignIcons.getImageSourceSync(
		'compass',
		24,
		theme.primary.val,
	)

	const settingsIconUnfocused = MaterialDesignIcons.getImageSourceSync(
		'cogs',
		24,
		theme.borderColor.val,
	)

	const settingsIconFocused = MaterialDesignIcons.getImageSourceSync(
		'cogs',
		24,
		theme.primary.val,
	)

	return (
		<Tab.Navigator initialRouteName={route.params?.screen ?? 'HomeTab'} render>
			<Tab.Screen
				name='HomeTab'
				component={Home}
				options={{
					title: 'Home',
					tabBarIcon: ({ focused }) =>
						focused ? jellyfishIconFocused! : jellyfishIconUnfocused!,
					tabBarButtonTestID: 'home-tab-button',
				}}
			/>

			<Tab.Screen
				name='LibraryTab'
				component={LibraryScreen}
				options={{
					title: 'Library',
					tabBarIcon: ({ focused }) =>
						focused ? libraryIconFocused! : libraryIconUnfocused!,
					tabBarButtonTestID: 'library-tab-button',
				}}
			/>

			<Tab.Screen
				name='SearchTab'
				component={SearchStack}
				options={{
					title: 'Search',
					tabBarIcon: ({ focused }) =>
						focused ? searchIconFocused! : searchIconUnfocused!,
					tabBarButtonTestID: 'search-tab-button',
				}}
			/>

			<Tab.Screen
				name='DiscoverTab'
				component={Discover}
				options={{
					title: 'Discover',
					tabBarIcon: ({ focused }) =>
						focused ? discoverIconFocused! : discoverIconUnfocused!,
					tabBarButtonTestID: 'discover-tab-button',
				}}
			/>

			<Tab.Screen
				name='SettingsTab'
				component={SettingsScreen}
				options={{
					title: 'Settings',
					tabBarIcon: ({ focused }) =>
						focused ? settingsIconFocused! : settingsIconUnfocused!,
					tabBarButtonTestID: 'settings-tab-button',
				}}
			/>
		</Tab.Navigator>
	)
}
