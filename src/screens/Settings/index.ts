import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Settings from '../../components/Settings/component'
import SignOutModal from './sign-out-modal'
import LibrarySelectionScreen from './library-selection'
import StorageManagementScreen from '../Storage'
import StorageSelectionModal from './storage-selection-modal'
import { SettingsStackParamList } from './types'
import { bottomSheetPresentation } from '../../utils/navigating/form-sheet'
import AccountScreen from './account'
import AboutScreen from './about'
import PrivacyDeveloperScreen from './privacy-developer'
import PlaybackScreen from './playback'
import GesturesScreen from './gestures'
import AppearanceScreen from './appearance'

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>({
	initialRouteName: 'Settings',
	screens: {
		Settings: {
			screen: Settings,
			options: {
				headerShown: false,
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			},
		},
		LibrarySelection: {
			screen: LibrarySelectionScreen,
			options: {
				title: 'Select Library',
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
				title: 'Storage Management',
				animation: 'slide_from_right',
				headerShown: true,
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
				title: 'Account',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
		Appearance: {
			screen: AppearanceScreen,
			options: {
				title: 'Appearance',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
		Gestures: {
			screen: GesturesScreen,
			options: {
				title: 'Gestures',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
		Playback: {
			screen: PlaybackScreen,
			options: {
				title: 'Playback',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
		PrivacyDeveloper: {
			screen: PrivacyDeveloperScreen,
			options: {
				title: 'Privacy & Developer',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
		About: {
			screen: AboutScreen,
			options: {
				title: 'About',
				animation: 'slide_from_right',
				headerShown: true,
			},
		},
	},
})

export default SettingsStack
