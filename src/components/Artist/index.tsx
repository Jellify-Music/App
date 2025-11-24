import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ArtistOverviewTab from './OverviewTab'
import ArtistTracksTab from './TracksTab'
import { useArtistContext } from '../../providers/Artist'

const Stack = createNativeStackNavigator()

export default function ArtistNavigation(): React.JSX.Element {
	const { artist } = useArtistContext()

	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name='ArtistOverviewTab' component={ArtistOverviewTab} />
			<Stack.Screen
				name='ArtistTracksTab'
				component={ArtistTracksTab}
				options={{
					headerShown: true,
					title: artist.Name ?? 'Untitled Artist',
				}}
			/>
		</Stack.Navigator>
	)
}
