import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ArtistScreen } from '../Artist'
import AlbumScreen from '../Album'
import { PlaylistScreen } from '../Playlist'
import { useTheme } from 'tamagui'
import Search from '../../components/Search'
import SearchParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'

const Stack = createNativeStackNavigator<SearchParamList>()

export default function SearchStack(): React.JSX.Element {
	const theme = useTheme()

	return (
		<Stack.Navigator>
			<Stack.Screen
				name='SearchScreen'
				component={Search}
				options={{
					title: 'Search',
					headerTitleStyle: {
						fontFamily: 'Figtree-Bold',
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
					title: route.params.playlist.Name ?? 'Untitled Playlist',
					headerTitleStyle: {
						color: theme.background.val,
					},
				})}
			/>

			<Stack.Screen
				name='InstantMix'
				component={InstantMix}
				options={({ route }) => ({
					headerTitle: `${getItemName(route.params.item)} Mix`,
				})}
			/>
		</Stack.Navigator>
	)
}
