import React from 'react'
import { StackParamList } from '../../components/types'
import Library from '../../components/Library/component'
import { AlbumScreen } from '../../components/Album'
import { PlaylistScreen } from '../Playlist'
import DetailsScreen from '../Detail'
import AddPlaylist from './add-playlist'
import DeletePlaylist from './delete-playlist'
import { ArtistScreen } from '../Artist'
import InstantMix from '../../components/InstantMix/component'
import { useTheme } from 'tamagui'
import { LibraryProvider } from '../../providers/Library'
import { useJellifyContext } from '../../providers'
import { LibrarySortAndFilterProvider } from '../../providers/Library/sorting-filtering'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator<StackParamList>()

export default function LibraryStack(): React.JSX.Element {
	const theme = useTheme()

	const { library, server } = useJellifyContext()

	return (
		<LibrarySortAndFilterProvider>
			<LibraryProvider>
				<Stack.Navigator initialRouteName='LibraryScreen'>
					<Stack.Screen
						name='LibraryScreen'
						component={Library}
						options={{
							title: `${library?.musicLibraryName ?? 'Music'} on ${server?.name ?? 'Jellyfin'}`,

							// I honestly don't think we need a header for this screen, given that there are
							// tabs on the top of the screen for navigating the library, but if we want one,
							// we can use the title above
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

					<Stack.Group
						screenOptions={{
							presentation: 'formSheet',
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
					</Stack.Group>

					<Stack.Group
						screenOptions={{
							presentation: 'formSheet',
							sheetAllowedDetents: [0.2],
						}}
					>
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
		</LibrarySortAndFilterProvider>
	)
}
