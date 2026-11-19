import { StaticParamList } from '@react-navigation/native'
import type LoginStack from '.'

export type LoginStackNavigator = typeof LoginStack

type LoginStackParamList = StaticParamList<LoginStackNavigator>

export default LoginStackParamList
