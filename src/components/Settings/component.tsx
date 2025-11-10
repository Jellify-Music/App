import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { getToken, getTokenValue, useTheme } from 'tamagui'
import AccountTab from './components/account-tab'
import Icon from '../Global/components/icon'
import PreferencesTab from './components/preferences-tab'
import PlaybackTab from './components/playback-tab'
import InfoTab from './components/info-tab'
import SettingsTabBar from './tab-bar'
import StorageTab from './components/usage-tab'
import { SafeAreaView } from 'react-native-safe-area-context'
const SettingsTabsNavigator = createMaterialTopTabNavigator()

export default function Settings(): React.JSX.Element {
	const theme = useTheme()

	return (
		<SettingsTabsNavigator.Navigator
			screenOptions={{
				tabBarShowIcon: true,
				tabBarItemStyle: {
					height: getToken('$12') + getToken('$6'),
				},
				tabBarActiveTintColor: theme.background.val,
				tabBarInactiveTintColor: theme.background50.val,
				tabBarStyle: {
					backgroundColor: theme.primary.val,
				},
				tabBarLabelStyle: {
					fontFamily: 'Figtree-Bold',
				},

				tabBarPressOpacity: 0.5,
				lazy: true, // Enable lazy loading to prevent all tabs from mounting simultaneously
			}}
			tabBar={(props) => <SettingsTabBar {...props} />}
		>
			<SettingsTabsNavigator.Screen
				name='Settings'
				component={PreferencesTab}
				options={{
					title: 'App',
					tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
						<Icon
							name={`jellyfish${!focused ? '-outline' : ''}`}
							color={focused ? '$background' : '$background50'}
							small
						/>
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='Playback'
				component={PlaybackTab}
				options={{
					title: 'Player',
					tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
						<Icon
							name='cassette'
							color={focused ? '$background' : '$background50'}
							small
						/>
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='Usage'
				component={StorageTab}
				options={{
					title: 'Usage',
					tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
						<Icon
							name='harddisk'
							color={focused ? '$background' : '$background50'}
							small
						/>
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='User'
				component={AccountTab}
				options={{
					tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
						<Icon
							name='account-music'
							color={focused ? '$background' : '$background50'}
							small
						/>
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='About'
				component={InfoTab}
				options={{
					tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
						<Icon
							name={`information${!focused ? '-outline' : ''}`}
							color={focused ? '$background' : '$background50'}
							small
						/>
					),
				}}
			/>
			{/*
				<SettingsTabsNavigator.Screen
					name='Labs'
					component={LabsTab}
					options={{
						tabBarIcon: ({ focused, color }) => (
							<Icon
								name='flask'
								color={focused ? '$primary' : '$borderColor'}
								small
							/>
						),
					}}
				/>
			) */}
		</SettingsTabsNavigator.Navigator>
	)
}
