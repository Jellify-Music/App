import AddPlaylist from './add-playlist'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import FiltersSheet from '../Filters'
import SortOptionsSheet from '../SortOptions'
import YearSelectionScreen from '../YearSelection'
import GenreSelectionScreen from '../GenreSelection'
import DeletePlaylist from './delete-playlist'
import LibraryTabs from '../../components/Library/component'
import { BaseStackScreens } from '../base-stack'
import ArtistsTab from '../../components/Library/components/artists-tab'
import AlbumsTab from '../../components/Library/components/albums-tab'
import TracksTab from '../../components/Library/components/tracks-tab'
import PlaylistsTab from '../../components/Library/components/playlists-tab'
import { LibraryParamList } from './types'

const LibraryStack = createNativeStackNavigator<LibraryParamList>({
	initialRouteName: 'LibraryScreen',
	screenOptions: {
		headerTitleAlign: 'center',
		headerTitleStyle: {
			fontFamily: 'Figtree-Bold',
		},
	},
	screens: {
		LibraryScreen: {
			screen: LibraryTabs,
			options: {
				title: 'Library',
			},
		},
		...BaseStackScreens,
		LibraryArtists: {
			screen: ArtistsTab,
			options: {
				title: 'Artists',
			},
		},
		LibraryAlbums: {
			screen: AlbumsTab,
			options: {
				title: 'Albums',
			},
		},
		LibraryTracks: {
			screen: TracksTab,
			options: {
				title: 'Tracks',
			},
		},
		Playlists: {
			screen: PlaylistsTab,
			options: {
				title: 'Playlists',
			},
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
