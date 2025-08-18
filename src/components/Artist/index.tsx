import React, { useMemo } from 'react'
import Albums from './albums'
import SimilarArtists from './similar'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import ArtistTabBar from './tab-bar'
import { useArtistContext } from '../../providers/Artist'
import ArtistTabList from './types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'

const ArtistTabs = createMaterialTopTabNavigator<ArtistTabList>()

export default function ArtistNavigation({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	const { featuredOn, artist } = useArtistContext()

	const hasFeaturedOn = useMemo(() => featuredOn && featuredOn.length > 0, [artist])

	return (
		<ArtistTabs.Navigator
			tabBar={(props) => <ArtistTabBar stackNavigation={navigation} tabBarProps={props} />}
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

			{hasFeaturedOn && (
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
