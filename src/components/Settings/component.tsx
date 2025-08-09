import React from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { getToken, useTheme } from 'tamagui'
import AccountTab from './components/account-tab'
import Icon from '../Global/components/icon'
import LabsTab from './components/labs-tab'
import PreferencesTab from './components/preferences-tab'
import PlaybackTab from './components/playback-tab'
import InfoTab from './components/info-tab'
import SettingsTabBar from './components/tab-bar'
import StorageTab from './components/storage-tab'
import { useSettingsContext } from '../../providers/Settings'
const SettingsTabsNavigator = createMaterialTopTabNavigator()

export default function Settings(): React.JSX.Element {
	const theme = useTheme()

	const { devTools } = useSettingsContext()

	return (
		<SettingsTabsNavigator.Navigator
			screenOptions={{
				tabBarGap: getToken('$size.0'),
				tabBarScrollEnabled: true,
				tabBarItemStyle: {
					width: getToken('$size.8'),
				},
				tabBarShowIcon: true,
				tabBarActiveTintColor: theme.primary.val,
				tabBarInactiveTintColor: theme.borderColor.val,
				tabBarLabelStyle: {
					fontFamily: 'Figtree-Bold',
				},
			}}
			tabBar={(props) => <SettingsTabBar {...props} />}
		>
			<SettingsTabsNavigator.Screen
				name='Settings'
				component={PreferencesTab}
				options={{
					title: 'App',
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='jellyfish-outline'
							color={focused ? '$primary' : '$borderColor'}
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
					tabBarIcon: ({ focused, color }) => (
						<Icon name='cassette' color={focused ? '$primary' : '$borderColor'} small />
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='Usage'
				component={StorageTab}
				options={{
					title: 'Usage',
					tabBarIcon: ({ focused, color }) => (
						<Icon name='harddisk' color={focused ? '$primary' : '$borderColor'} small />
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='User'
				component={AccountTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='account-music'
							color={focused ? '$primary' : '$borderColor'}
							small
						/>
					),
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='About'
				component={InfoTab}
				options={{
					tabBarIcon: ({ focused, color }) => (
						<Icon
							name='information'
							color={focused ? '$primary' : '$borderColor'}
							small
						/>
					),
				}}
			/>
			{devTools && (
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
			)}
		</SettingsTabsNavigator.Navigator>
	)
}
