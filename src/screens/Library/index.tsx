import React from 'react'
import Library from '../../components/Library/component'
import { PlaylistScreen } from '../Playlist'
import AddPlaylist from './add-playlist'
import ArtistScreen from '../Artist'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AlbumScreen from '../Album'
import LibraryStackParamList from './types'
import InstantMix from '../../components/InstantMix/component'
import { getItemName } from '../../utils/formatting/item-names'
import TracksScreen from '../Tracks'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import FiltersSheet from '../Filters'
import SortOptionsSheet from '../SortOptions'
import YearSelectionScreen from '../YearSelection'
import GenreSelectionScreen from '../GenreSelection'
import DeletePlaylist from './delete-playlist'
import LibraryTabs from '../../components/Library/component'

const LibraryStack = createNativeStackNavigator<LibraryStackParamList>({
	initialRouteName: 'LibraryScreen',
	screens: {
		LibraryScreen: {
			screen: LibraryTabs,
			options: {
				title: 'Library',

				// I honestly don't think we need a header for this screen, given that there are
				// tabs on the top of the screen for navigating the library, but if we want one,
				// we can use the title above
				headerShown: false,
			},
		},
		Artist: {
			screen: ArtistScreen,
			options: ({ route }) => ({
				title: route.params.artist.Name ?? 'Unknown Artist',
			}),
		},
		Album: {
			screen: AlbumScreen,
			options: ({ route }) => ({
				title: route.params.album.Name ?? 'Untitled Album',
			}),
		},
		Playlist: {
			screen: PlaylistScreen,
			options: ({ route }) => ({
				title: route.params.playlist.Name ?? 'Untitled Playlist',
			}),
		},
		InstantMix: {
			screen: InstantMix,
			options: ({ route }) => ({
				headerTitle: `${getItemName(route.params.item)} Mix`,
			}),
		},
		AddPlaylist: {
			screen: AddPlaylist,
			options: {
				title: 'Add Playlist',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				headerShown: false,
				sheetGrabberVisible: true,
			},
		},
		Tracks: {
			screen: TracksScreen,
		},
		Filters: {
			screen: FiltersSheet,
			options: {
				headerTitle: 'Filters',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		SortOptions: {
			screen: SortOptionsSheet,
			options: {
				headerTitle: 'Sort',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		GenreSelection: {
			screen: GenreSelectionScreen,
			options: {
				headerTitle: 'Select Genres',
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		YearSelection: {
			screen: YearSelectionScreen,
			options: {
				headerTitle: 'Year range',
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		DeletePlaylist: {
			screen: DeletePlaylist,
			options: {
				title: 'Delete Playlist',
				presentation: bottomSheetPresentation,
				headerShown: false,
				sheetGrabberVisible: true,
				sheetAllowedDetents: 'fitToContents',
			},
		},
	},
})

export default LibraryStack
