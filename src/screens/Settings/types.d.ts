import { NativeStackScreenProps } from '@react-navigation/native-stack'

export type SettingsStackParamList = {
	Settings: undefined
	SignOut: undefined
	LibrarySelection: undefined
	StorageManagement: undefined
	StorageSelectionReview: undefined
	Appearance: undefined
	Gestures: undefined
	Playback: undefined
	PrivacyDeveloper: undefined
	About: undefined
	PlayerTheme: undefined
}

export type SettingsProps = NativeStackScreenProps<SettingsStackParamList, 'Settings'>
export type SignOutModalProps = NativeStackScreenProps<SettingsStackParamList, 'SignOut'>
