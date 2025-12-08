import React, { useState } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import ArtistOverviewTab from './OverviewTab'
import ArtistTracksTab from './TracksTab'
import ArtistTabBar from './TabBar'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { getTokenValue, useTheme } from 'tamagui'

const Tab = createMaterialTopTabNavigator()

export default function ArtistNavigation({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	const [isFavorites, setIsFavorites] = useState(false)
	const [sortBy, setSortBy] = useState<ItemSortBy>(ItemSortBy.SortName)
	const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Ascending)

	const theme = useTheme()

	return (
		<Tab.Navigator
			tabBar={(props) => (
				<ArtistTabBar
					{...props}
					isFavorites={isFavorites}
					setIsFavorites={setIsFavorites}
					sortBy={sortBy}
					setSortBy={setSortBy}
					sortOrder={sortOrder}
					setSortOrder={setSortOrder}
				/>
			)}
			screenOptions={{
				swipeEnabled: false,
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
					fontSize: 16,
					fontFamily: 'Figtree-Bold',
				},
				tabBarPressOpacity: 0.5,
				lazy: true, // Enable lazy loading to prevent all tabs from mounting simultaneously
			}}
		>
			<Tab.Screen name='Overview'>
				{() => <ArtistOverviewTab navigation={navigation} />}
			</Tab.Screen>
			<Tab.Screen name='Tracks'>
				{() => (
					<ArtistTracksTab
						navigation={navigation}
						isFavorites={isFavorites}
						sortBy={sortBy}
						sortOrder={sortOrder}
					/>
				)}
			</Tab.Screen>
		</Tab.Navigator>
	)
}
