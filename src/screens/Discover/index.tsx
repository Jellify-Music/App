import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StackParamList } from '../../components/types'
import Index from '../../components/Discover/component'
import DetailsScreen from '../Detail'
import { AlbumScreen } from '../../components/Album'
import { ArtistScreen } from '../Artist'
import { DiscoverProvider } from '../../providers/Discover'
import InstantMix from '../../components/InstantMix/component'
import { useTheme } from 'tamagui'
import RecentlyAdded from './albums'
import PublicPlaylists from './playlists'
import { PlaylistScreen } from '../Playlist'

export const DiscoverStack = createNativeStackNavigator<StackParamList>()

export function Discover(): React.JSX.Element {
	const theme = useTheme()

	return (
		<DiscoverProvider>
			<DiscoverStack.Navigator initialRouteName='Discover' screenOptions={{}}>
				<DiscoverStack.Screen
					name='Discover'
					component={Index}
					options={{
						headerTitleStyle: {
							fontFamily: 'Figtree-Bold',
						},
					}}
				/>

				<DiscoverStack.Screen
					name='Artist'
					component={ArtistScreen}
					options={({ route }) => ({
						title: route.params.artist.Name ?? 'Unknown Artist',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<DiscoverStack.Screen
					name='Album'
					component={AlbumScreen}
					options={({ route }) => ({
						title: route.params.album.Name ?? 'Untitled Album',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<DiscoverStack.Screen
					name='Playlist'
					component={PlaylistScreen}
					options={({ route }) => ({
						title: route.params.playlist.Name ?? 'Untitled Playlist',
					})}
				/>

				<DiscoverStack.Screen
					name='RecentlyAdded'
					component={RecentlyAdded}
					options={{
						title: 'Recently Added',
						headerTitleStyle: {
							fontFamily: 'Figtree-Bold',
						},
					}}
				/>

				<DiscoverStack.Screen
					name='PublicPlaylists'
					component={PublicPlaylists}
					options={{
						title: 'Public Playlists',
						headerTitleStyle: {
							fontFamily: 'Figtree-Bold',
							color: theme.background.val,
						},
					}}
				/>

				<DiscoverStack.Screen
					name='InstantMix'
					component={InstantMix}
					options={({ route }) => ({
						title: route.params.item.Name
							? `${route.params.item.Name} Mix`
							: 'Instant Mix',
					})}
				/>

				<DiscoverStack.Group screenOptions={{ presentation: 'modal' }}>
					<DiscoverStack.Screen
						name='Details'
						component={DetailsScreen}
						options={{
							headerShown: false,
						}}
					/>
				</DiscoverStack.Group>
			</DiscoverStack.Navigator>
		</DiscoverProvider>
	)
}
