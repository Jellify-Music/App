import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SearchScreen from './screen'
import { StackParamList } from '../types'
import { ArtistScreen } from '../Artist'
import { AlbumScreen } from '../Album'
import { PlaylistScreen } from '../Playlist/screen'
import DetailsScreen from '../ItemDetail/screen'
import InstantMix from '../InstantMix/component'
import { useTheme } from 'tamagui'

const Stack = createNativeStackNavigator<StackParamList>()

export default function SearchStack(): React.JSX.Element {
	const theme = useTheme()

	return (
		<Stack.Navigator>
			<Stack.Screen
				name='Search'
				component={SearchScreen}
				options={{
					headerLargeTitle: true,
					headerTitleStyle: {
						fontFamily: 'Aileron-Bold',
					},
				}}
			/>

			<Stack.Screen
				name='Artist'
				component={ArtistScreen}
				options={({ route }) => ({
					title: route.params.artist.Name ?? 'Unknown Artist',
					headerTitleStyle: {
						color: theme.background.val,
					},
				})}
			/>

			<Stack.Screen
				name='Album'
				component={AlbumScreen}
				options={({ route }) => ({
					headerShown: true,
					title: route.params.album.Name ?? 'Untitled Album',
					headerTitleStyle: {
						color: theme.background.val,
					},
				})}
			/>

			<Stack.Screen
				name='Playlist'
				component={PlaylistScreen}
				options={({ route }) => ({
					headerShown: true,
					title: route.params.playlist.Name ?? 'Untitled Playlist',
					headerTitleStyle: {
						color: theme.background.val,
					},
				})}
			/>

			<Stack.Screen
				name='Details'
				component={DetailsScreen}
				options={{
					headerShown: false,
					presentation: 'modal',
				}}
			/>

			<Stack.Screen
				name='InstantMix'
				component={InstantMix}
				options={({ route }) => ({
					title: route.params.item.Name ? `${route.params.item.Name} Mix` : 'Instant Mix',
				})}
			/>
		</Stack.Navigator>
	)
}
