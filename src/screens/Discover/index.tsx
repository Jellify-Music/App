import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Index from '../../components/Discover/component'
import AlbumScreen from '../Album'
import { ArtistScreen } from '../Artist'
import { useTheme } from 'tamagui'
import RecentlyAdded from './albums'
import PublicPlaylists from './playlists'
import { PlaylistScreen } from '../Playlist'
import SuggestedArtists from './artists'
import DiscoverStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'

export const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>()

export function Discover(): React.JSX.Element {
	const theme = useTheme()

	return (
		<DiscoverStack.Navigator initialRouteName='Discover'>
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
				name='SuggestedArtists'
				component={SuggestedArtists}
				options={{
					title: 'Suggested Artists',
				}}
			/>

			<DiscoverStack.Screen
				name='InstantMix'
				component={InstantMix}
				options={({ route }) => ({
					headerTitle: `${getItemName(route.params.item)} Mix`,
				})}
			/>
		</DiscoverStack.Navigator>
	)
}
