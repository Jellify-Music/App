import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ArtistScreen } from '../Artist'
import AlbumScreen from '../Album'
import { PlaylistScreen } from '../Playlist'
import { useTheme } from 'tamagui'
import Favorites from '../../components/Favorites'
import FavoritesStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'
import AddPlaylist from '../Playlist/add-playlist'
import { Platform } from 'react-native'

const Stack = createNativeStackNavigator<FavoritesStackParamList>()

export default function FavoritesStack(): React.JSX.Element {
	const theme = useTheme()

	return (
		<Stack.Navigator>
			<Stack.Screen
				name='SearchScreen'
				component={Favorites}
				options={{
					title: 'Favorites',
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

			<Stack.Group
				screenOptions={{
					presentation: 'formSheet',
					sheetAllowedDetents: Platform.OS === 'ios' ? 'fitToContents' : [0.5],
				}}
			>
				<Stack.Screen
					name='AddPlaylist'
					component={AddPlaylist}
					options={{
						title: 'Add Playlist',
					}}
				/>
			</Stack.Group>
		</Stack.Navigator>
	)
}
