import React from 'react'
import Library from '../../components/Library/component'
import { PlaylistScreen } from '../Playlist'
import AddPlaylist from './add-playlist'
import DeletePlaylist from './delete-playlist'
import { ArtistScreen } from '../Artist'
import { useTheme } from 'tamagui'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AlbumScreen from '../Album'
import LibraryStackParamList from './types'
import { LibraryTabProps } from '../Tabs/types'
import { LibrarySortAndFilterProvider } from '../../providers/Library'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/text'

const LibraryStack = createNativeStackNavigator<LibraryStackParamList>()

export default function LibraryScreen({ route, navigation }: LibraryTabProps): React.JSX.Element {
	const theme = useTheme()

	return (
		<LibrarySortAndFilterProvider>
			<LibraryStack.Navigator initialRouteName='LibraryScreen'>
				<LibraryStack.Screen
					name='LibraryScreen'
					component={Library}
					options={{
						title: 'Library',

						// I honestly don't think we need a header for this screen, given that there are
						// tabs on the top of the screen for navigating the library, but if we want one,
						// we can use the title above
						headerShown: false,
					}}
				/>

				<LibraryStack.Screen
					name='Artist'
					component={ArtistScreen}
					options={({ route }) => ({
						title: route.params.artist.Name ?? 'Unknown Artist',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<LibraryStack.Screen
					name='Album'
					component={AlbumScreen}
					options={({ route }) => ({
						title: route.params.album.Name ?? 'Untitled Album',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<LibraryStack.Screen
					name='Playlist'
					component={PlaylistScreen}
					options={({ route }) => ({
						title: route.params.playlist.Name ?? 'Untitled Playlist',
						headerTitleStyle: {
							color: theme.background.val,
						},
					})}
				/>

				<LibraryStack.Screen
					name='InstantMix'
					component={InstantMix}
					options={({ route }) => ({
						headerTitle: `${getItemName(route.params.item)} Mix`,
					})}
				/>

				<LibraryStack.Group
					screenOptions={{
						presentation: 'formSheet',
						sheetAllowedDetents: 'fitToContents',
					}}
				>
					<LibraryStack.Screen
						name='AddPlaylist'
						component={AddPlaylist}
						options={{
							title: 'Add Playlist',
						}}
					/>

					<LibraryStack.Screen
						name='DeletePlaylist'
						component={DeletePlaylist}
						options={{
							title: 'Delete Playlist',
							headerShown: false,
							sheetGrabberVisible: true,
						}}
					/>
				</LibraryStack.Group>
			</LibraryStack.Navigator>
		</LibrarySortAndFilterProvider>
	)
}
