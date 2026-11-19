import { StaticParamList } from '@react-navigation/native'
import type Tabs from '.'

export type TabNavigator = typeof Tabs

type TabParamList = StaticParamList<TabNavigator>

export default TabParamList
