import React from 'react'
import Albums from './albums'
import SimilarArtists from './similar'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { StackParamList } from '../types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ArtistTabBar from './tab-bar'
import { useArtistContext } from '../../providers/Artist'

const ArtistTabs = createMaterialTopTabNavigator<StackParamList>()

export default function ArtistNavigation({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { featuredOn, artist } = useArtistContext()

	return (
		<ArtistTabs.Navigator
			tabBar={(props) => ArtistTabBar(props, navigation)}
			screenOptions={{
				tabBarLabelStyle: {
					fontFamily: 'Figtree-Bold',
				},
			}}
		>
			<ArtistTabs.Screen
				name='ArtistAlbums'
				options={{
					title: 'Albums',
				}}
				component={Albums}
			/>

			<ArtistTabs.Screen
				name='ArtistEps'
				options={{
					title: 'Singles & EPs',
				}}
				component={Albums}
			/>

			{featuredOn && featuredOn.length > 0 && (
				<ArtistTabs.Screen
					name='ArtistFeaturedOn'
					options={{
						title: 'Featured On',
					}}
					component={Albums}
				/>
			)}

			<ArtistTabs.Screen
				name='SimilarArtists'
				options={{
					title: `Similar to ${artist.Name?.slice(0, 20) ?? 'Unknown Artist'}${
						artist.Name && artist.Name.length > 20 ? '...' : ''
					}`,
				}}
				component={SimilarArtists}
			/>
		</ArtistTabs.Navigator>
	)
}
