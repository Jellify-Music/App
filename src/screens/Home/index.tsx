import _ from 'lodash'
import { HomeProvider } from '../../providers/Home'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PlaylistScreen } from '../Playlist'
import { ProvidedHome } from '../../components/Home'
import { ArtistScreen } from '../Artist'
import { useTheme, XStack } from 'tamagui'
import HomeArtistsScreen from './artists'
import HomeTracksScreen from './tracks'
import AlbumScreen from '../Album'
import HomeStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'
import FavoriteButton from '../../components/Global/components/favorite-button'
import InstantMixButton from '../../components/Global/components/instant-mix-button'

const HomeStack = createNativeStackNavigator<HomeStackParamList>()

/**
 * The main screen for the home tab.
 * @returns The {@link Home} component
 */
export default function Home(): React.JSX.Element {
	const theme = useTheme()

	return (
		<HomeProvider>
			<HomeStack.Navigator initialRouteName='HomeScreen'>
				<HomeStack.Group>
					<HomeStack.Screen
						name='HomeScreen'
						component={ProvidedHome}
						options={{
							title: 'Home',
							headerShown: false,
							headerTitleStyle: {
								fontFamily: 'Figtree-Bold',
							},
						}}
					/>
					<HomeStack.Screen
						name='Artist'
						component={ArtistScreen}
						options={({ route, navigation }) => ({
							title: route.params.artist.Name ?? 'Unknown Artist',
							headerTitleStyle: {
								color: 'transparent',
								fontFamily: 'Figtree-Bold',
							},
							headerTransparent: true,
							headerRight: () => (
								<XStack gap={'$4'}>
									<InstantMixButton
										item={route.params.artist}
										navigation={navigation}
									/>

									<FavoriteButton item={route.params.artist} />
								</XStack>
							),
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
				</HomeStack.Group>
			</HomeStack.Navigator>
		</HomeProvider>
	)
}
