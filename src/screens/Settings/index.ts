import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Settings from '../../components/Settings/component'
import SignOutModal from './sign-out-modal'
import LibrarySelectionScreen from './library-selection'
import StorageManagementScreen from '../Storage'
import StorageSelectionModal from './storage-selection-modal'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import AccountScreen from '../Account'
import AboutScreen from '../About'
import PrivacyDeveloperScreen from './privacy-developer'
import PlaybackScreen from './playback'
import GesturesScreen from './gestures'
import AppearanceScreen from './appearance'
import { stackScreenOptions } from '../navigation'
import i18n from '../../i18n'

const SettingsStack = createNativeStackNavigator({
	initialRouteName: 'Settings',
	screenOptions: stackScreenOptions,
	screens: {
		Settings: {
			screen: Settings,
			options: {
				headerShown: false,
			},
		},
		LibrarySelection: {
			screen: LibrarySelectionScreen,
			options: {
				title: i18n.t('navigation.selectLibrary'),
			},
		},
		SignOut: {
			screen: SignOutModal,
			options: {
				/* https://www.reddit.com/r/reactnative/comments/1dgktbn/comment/lxd23sj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button */
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
				headerShown: false,
			},
		},
		StorageManagement: {
			screen: StorageManagementScreen,
			options: {
				title: i18n.t('navigation.storageManagement'),
			},
		},
		StorageSelectionReview: {
			screen: StorageSelectionModal,
			options: {
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
				headerShown: false,
			},
		},
		Account: {
			screen: AccountScreen,
			options: {
				title: i18n.t('navigation.account'),
			},
		},
		Appearance: {
			screen: AppearanceScreen,
			options: {
				title: i18n.t('settings.sections.appearance'),
			},
		},
		Gestures: {
			screen: GesturesScreen,
			options: {
				title: i18n.t('settings.sections.gestures'),
			},
		},
		Playback: {
			screen: PlaybackScreen,
			options: {
				title: i18n.t('settings.sections.playback'),
			},
		},
		PrivacyDeveloper: {
			screen: PrivacyDeveloperScreen,
			options: {
				title: i18n.t('settings.sections.privacyDeveloper'),
			},
		},
		About: {
			screen: AboutScreen,
			options: {
				title: i18n.t('settings.sections.about'),
			},
		},
	},
})

export default SettingsStack
