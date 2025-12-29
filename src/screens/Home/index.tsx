import _ from 'lodash'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PlaylistScreen } from '../Playlist'
import { Home as HomeComponent } from '../../components/Home'
import ArtistScreen from '../Artist'
import { getTokenValue, useTheme } from 'tamagui'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import AlbumScreen from '../Album'
import HomeStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'
import TracksScreen from '../Tracks'

const HomeStack = createNativeStackNavigator<HomeStackParamList>()

/**
 * The main screen for the home tab.
 * @returns The {@link Home} component
 */
export default function Home(): React.JSX.Element {
	const theme = useTheme()

	return (
		<HomeStack.Navigator initialRouteName='HomeScreen'>
			<HomeStack.Group>
				<HomeStack.Screen
					name='HomeScreen'
					component={HomeComponent}
					options={{
						title: 'Home',
						headerTitleAlign: 'center',
						headerTitleStyle: {
							fontFamily: 'Figtree-Bold',
							fontSize: getTokenValue('$6'),
						},
					}}
				/>
				<HomeStack.Screen
					name='Artist'
					component={ArtistScreen}
					options={({ route }) => ({
						title: route.params.artist.Name ?? 'Unknown Artist',
						headerTitleStyle: {
							color: theme.background.val,
							fontFamily: 'Figtree-Bold',
						},
					})}
				/>

				<HomeStack.Screen
					name='RecentArtists'
					component={HomeArtistsScreen}
					options={{ title: 'Recent Artists' }}
				/>
				<HomeStack.Screen
					name='MostPlayedArtists'
					component={HomeArtistsScreen}
					options={{ title: 'Most Played' }}
				/>

				<HomeStack.Screen
					name='RecentTracks'
					component={HomeTracksScreen}
					options={{ title: 'Recently Played' }}
				/>

				<HomeStack.Screen
					name='MostPlayedTracks'
					component={HomeTracksScreen}
					options={{ title: 'On Repeat' }}
				/>

				<HomeStack.Screen
					name='Album'
					component={AlbumScreen}
					options={({ route }) => ({
						title: route.params.album.Name ?? 'Untitled Album',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<HomeStack.Screen
					name='Playlist'
					component={PlaylistScreen}
					options={({ route }) => ({
						headerShown: false,
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<HomeStack.Screen
					name='InstantMix'
					component={InstantMix}
					options={({ route }) => ({
						headerTitle: `${getItemName(route.params.item)} Mix`,
					})}
				/>

				<HomeStack.Screen name='Tracks' component={TracksScreen} />
			</HomeStack.Group>
		</HomeStack.Navigator>
	)
}
