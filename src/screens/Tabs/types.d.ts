import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { NavigatorScreenParams } from '@react-navigation/native'
import FavoritesStackParamList from '../Favorites/types'

import SearchParamList from '../Search/types'

type TabParamList = {
	HomeTab: undefined
	FavoritesTab: undefined | NavigatorScreenParams<FavoritesStackParamList>
	SearchTab: undefined | NavigatorScreenParams<SearchParamList>
	DiscoverTab: undefined
	SettingsTab: undefined
}

export type HomeTabProps = BottomTabScreenProps<TabParamList, 'HomeTab'>
export type FavoritesTabProps = BottomTabScreenProps<TabParamList, 'FavoritesTab'>

export default TabParamList
