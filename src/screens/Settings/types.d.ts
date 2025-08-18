import { NativeStackScreenProps } from '@react-navigation/native-stack'

export type SettingsStackParamList = {
	Settings: undefined
	SignOut: undefined
	LibrarySelection: undefined

	Account: undefined
	Server: undefined
	Playback: undefined
	Labs: undefined
}

export type SettingsProps = NativeStackScreenProps<SettingsStackParamList, 'Settings'>
export type SignOutModalProps = NativeStackScreenProps<SettingsStackParamList, 'SignOut'>
