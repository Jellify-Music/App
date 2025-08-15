import _ from 'lodash'
import { HomeProvider } from '../../providers/Home'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StackParamList } from '../../components/types'
import { PlaylistScreen } from '../Playlist'
import { ProvidedHome } from '../../components/Home'
import DetailsScreen from '../Detail'
import { ArtistScreen } from '../Artist'
import InstantMix from '../../components/InstantMix/component'
import { useTheme } from 'tamagui'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import AlbumScreen from '../Album'

const HomeStack = createNativeStackNavigator<StackParamList>()

/**
 * The main screen for the home tab.
 * @returns The {@link Home} component
 */
export default function Home(): React.JSX.Element {
	const theme = useTheme()

	return (
		<HomeProvider>
			<HomeStack.Navigator
				initialRouteName='HomeScreen'
				screenOptions={{ headerShown: false }}
			>
				<HomeStack.Group>
					<HomeStack.Screen
						name='HomeScreen'
						component={ProvidedHome}
						options={{
							title: 'Home',
							headerTitleStyle: {
								fontFamily: 'Figtree-Bold',
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
							title: route.params.item.Name
								? `${route.params.item.Name} Mix`
								: 'Instant Mix',
						})}
					/>
				</HomeStack.Group>

				<HomeStack.Group screenOptions={{ presentation: 'modal' }}>
					<HomeStack.Screen
						name='Details'
						component={DetailsScreen}
						options={{
							headerShown: false,
						}}
					/>
				</HomeStack.Group>
			</HomeStack.Navigator>
		</HomeProvider>
	)
}
