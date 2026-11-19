import { StaticParamList } from '@react-navigation/native'
import type SearchStack from '.'

export type SearchStackNavigator = typeof SearchStack

type SearchParamList = StaticParamList<SearchStackNavigator>

export default SearchParamList
