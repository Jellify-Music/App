import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { NavigatorScreenParams } from '@react-navigation/native'
import LibraryStackParamList from '../Library/types'

type TabParamList = {
	PlayerTab: undefined
	HomeTab: undefined
	LibraryTab: undefined | NavigatorScreenParams<LibraryStackParamList>
	SearchTab: undefined
	DiscoverTab: undefined
	QueueTab: undefined
	SettingsTab: undefined
}

export type HomeTabProps = BottomTabScreenProps<TabParamList, 'HomeTab'>
export type LibraryTabProps = BottomTabScreenProps<TabParamList, 'LibraryTab'>

export default TabParamList
