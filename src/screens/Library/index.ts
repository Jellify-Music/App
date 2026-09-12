import AddPlaylist from './add-playlist'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import FiltersSheet from '../Filters'
import SortOptionsSheet from '../SortOptions'
import YearSelectionScreen from '../YearSelection'
import GenreSelectionScreen from '../GenreSelection'
import DeletePlaylist from './delete-playlist'
import { LibraryTabs } from '../../components/Library/component'
import { BaseStackScreens } from '../base-stack'
import { LibraryParamList } from './types'
import ItemSortBy from '../../components/Library/sort-by'

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
		ItemSortBy: {
			screen: ItemSortBy,
			options: {
				title: 'Sort By',
				presentation: bottomSheetPresentation,
				headerShown: false,
				sheetGrabberVisible: true,
				sheetAllowedDetents: 'fitToContents',
			},
		},
	},
})

export default LibraryStack
