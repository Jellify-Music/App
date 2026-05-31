import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { NavigatorScreenParams } from '@react-navigation/native'
import LibraryStackParamList from '../Library/types'
import Tabs from '.'

type TabParamList = {
	HomeTab: undefined
	LibraryTab: undefined | NavigatorScreenParams<LibraryStackParamList>
	SearchTab: undefined
	DiscoverTab: undefined
	SettingsTab: undefined
}

export type HomeTabProps = BottomTabScreenProps<TabParamList, 'HomeTab'>
export type LibraryTabProps = BottomTabScreenProps<TabParamList, 'LibraryTab'>

export default TabParamList

type BottomTabType = typeof Tabs
export type BottomTabParamList = StaticParamList<BottomTabType>

declare module '@react-navigation/core' {
	interface BottomTabNavigator extends BottomTabType {}
}
