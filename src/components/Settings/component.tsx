import React, { Suspense, lazy } from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { getToken, getTokenValue, useTheme, Spinner, YStack } from 'tamagui'
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

	return (
		<SettingsTabsNavigator.Navigator
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
