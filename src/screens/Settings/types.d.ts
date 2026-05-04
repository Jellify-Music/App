import { NativeStackScreenProps } from '@react-navigation/native-stack'

export type SettingsStackParamList = {
	Settings: undefined
	SignOut: undefined
	LibrarySelection: undefined
	StorageManagement: undefined
	StorageSelectionReview: undefined
}

export type SettingsProps = NativeStackScreenProps<SettingsStackParamList, 'Settings'>
export type SignOutModalProps = NativeStackScreenProps<SettingsStackParamList, 'SignOut'>

export type StorageManagementProps = NativeStackScreenProps<
	SettingsStackParamList,
	'StorageManagement'
>
