import AddPlaylist from './add-playlist'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import FiltersSheet from '../Filters'
import SortOptionsSheet from '../SortOptions'
import YearSelectionScreen from '../YearSelection'
import GenreSelectionScreen from '../GenreSelection'
import DeletePlaylist from './delete-playlist'
import LibraryTabs from '../../components/Library/component'
import { BaseStack } from '../base-stack'
import { stackScreenOptions } from '../navigation'
import GeneratePlaylistScreen from './generate-playlist'
import i18n from '../../i18n'

const LibraryStack = createNativeStackNavigator({
	initialRouteName: 'LibraryScreen',
	screenOptions: stackScreenOptions,
	screens: {
		LibraryScreen: {
			screen: LibraryTabs,
			options: {
				title: i18n.t('navigation.library'),

				// I honestly don't think we need a header for this screen, given that there are
				// tabs on the top of the screen for navigating the library, but if we want one,
				// we can use the title above
				headerShown: false,
			},
		},
		...BaseStack,
		AddPlaylist: {
			screen: AddPlaylist,
			options: {
				title: i18n.t('library.createPlaylist'),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		Filters: {
			screen: FiltersSheet,
			options: {
				headerTitle: i18n.t('navigation.filters'),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		SortOptions: {
			screen: SortOptionsSheet,
			options: {
				headerTitle: i18n.t('library.sort'),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		GenreSelection: {
			screen: GenreSelectionScreen,
			options: {
				headerTitle: i18n.t('genres.title'),
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		YearSelection: {
			screen: YearSelectionScreen,
			options: {
				headerTitle: i18n.t('filters.yearRange'),
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		DeletePlaylist: {
			screen: DeletePlaylist,
			options: {
				title: i18n.t('context.deletePlaylist'),
				presentation: bottomSheetPresentation,
				headerShown: false,
				sheetGrabberVisible: true,
				sheetAllowedDetents: 'fitToContents',
			},
		},
		GeneratePlaylist: {
			screen: GeneratePlaylistScreen,
			options: {
				title: i18n.t('library.generatePlaylist'),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
	},
})

export default LibraryStack
