import React, { Suspense, lazy } from 'react'
import { useColorScheme } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { getTokenValue, useTheme, Spinner, YStack } from 'tamagui'
import { useColorPresetSetting, useThemeSetting } from '../../stores/settings/app'
import SettingsTabBar from './tab-bar'

// Lazy load tab components to improve initial render
const PreferencesTab = lazy(() => import('./components/preferences-tab'))
const PlaybackTab = lazy(() => import('./components/playback-tab'))
const StorageTab = lazy(() => import('./components/usage-tab'))
const AccountTab = lazy(() => import('./components/account-tab'))
const InfoTab = lazy(() => import('./components/info-tab'))

const SettingsTabsNavigator = createMaterialTopTabNavigator()

function TabFallback() {
	return (
		<YStack flex={1} alignItems='center' justifyContent='center' backgroundColor='$background'>
			<Spinner size='large' color='$primary' />
		</YStack>
	)
}

// Wrap lazy components with Suspense
function LazyPreferencesTab() {
	return (
		<Suspense fallback={<TabFallback />}>
			<PreferencesTab />
		</Suspense>
	)
}

function LazyPlaybackTab() {
	return (
		<Suspense fallback={<TabFallback />}>
			<PlaybackTab />
		</Suspense>
	)
}

function LazyStorageTab() {
	return (
		<Suspense fallback={<TabFallback />}>
			<StorageTab />
		</Suspense>
	)
}

function LazyAccountTab() {
	return (
		<Suspense fallback={<TabFallback />}>
			<AccountTab />
		</Suspense>
	)
}

function LazyInfoTab() {
	return (
		<Suspense fallback={<TabFallback />}>
			<InfoTab />
		</Suspense>
	)
}

export default function Settings(): React.JSX.Element {
	const theme = useTheme()
	const [themeSetting] = useThemeSetting()
	const [colorPreset] = useColorPresetSetting()
	const isDarkMode = useColorScheme() === 'dark'
	const resolvedMode = themeSetting === 'system' ? (isDarkMode ? 'dark' : 'light') : themeSetting
	// Key forces navigator to remount when preset/mode changes so tab bar colors update
	const themeKey = `${colorPreset}_${resolvedMode}`

	return (
		<SettingsTabsNavigator.Navigator
			key={themeKey}
			screenOptions={{
				tabBarIndicatorStyle: {
					borderColor: theme.background.val,
					borderBottomWidth: getTokenValue('$2'),
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
				lazy: true,
				lazyPreloadDistance: 0, // Only load the active tab
			}}
			tabBar={(props) => <SettingsTabBar {...props} />}
		>
			<SettingsTabsNavigator.Screen
				name='Settings'
				component={LazyPreferencesTab}
				options={{
					title: 'App',
				}}
			/>

			<SettingsTabsNavigator.Screen
				name='Playback'
				component={LazyPlaybackTab}
				options={{
					title: 'Player',
				}}
			/>

			<SettingsTabsNavigator.Screen name='Usage' component={LazyStorageTab} />

			<SettingsTabsNavigator.Screen name='User' component={LazyAccountTab} />

			<SettingsTabsNavigator.Screen name='About' component={LazyInfoTab} />
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
