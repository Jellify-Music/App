import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { StackParamList } from '../../components/types'
import Library from '../../components/Library/component'
import { AlbumScreen } from '../../components/Album'
import { PlaylistScreen } from '../Playlist'
import DetailsScreen from '../Detail'
import AddPlaylist from '../../components/Library/components/add-playlist'
import DeletePlaylist from '../../components/Library/components/delete-playlist'
import { ArtistScreen } from '../Artist'
import InstantMix from '../../components/InstantMix/component'
import { useTheme } from 'tamagui'
import { LibraryProvider } from '../../providers/Library'
const Stack = createNativeStackNavigator<StackParamList>()

export default function LibraryStack(): React.JSX.Element {
	const theme = useTheme()

	return (
		<LibraryProvider>
			<Stack.Navigator initialRouteName='Library'>
				<Stack.Screen
					name='Library'
					component={Library}
					options={{
						headerShown: false,
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
					name='InstantMix'
					component={InstantMix}
					options={({ route }) => ({
						title: route.params.item.Name
							? `${route.params.item.Name} Mix`
							: 'Instant Mix',
					})}
				/>

				<Stack.Group screenOptions={{ presentation: 'modal' }}>
					<Stack.Screen
						name='Details'
						component={DetailsScreen}
						options={{
							headerShown: false,
						}}
					/>
				</Stack.Group>

				{/* https://www.reddit.com/r/reactnative/comments/1dgktbn/comment/lxd23sj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button */}
				<Stack.Group
					screenOptions={{
						presentation: 'formSheet',
						sheetInitialDetentIndex: 0,
						sheetAllowedDetents: [0.35],
					}}
				>
					<Stack.Screen
						name='AddPlaylist'
						component={AddPlaylist}
						options={{
							title: 'Add Playlist',
						}}
					/>

					<Stack.Screen
						name='DeletePlaylist'
						component={DeletePlaylist}
						options={{
							title: 'Delete Playlist',
						}}
					/>
				</Stack.Group>
			</Stack.Navigator>
		</LibraryProvider>
	)
}
