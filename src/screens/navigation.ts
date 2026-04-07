import { createNavigationContainerRef } from '@react-navigation/native'
import { RootStackParamList } from './types'

const navigationRef = createNavigationContainerRef<RootStackParamList>()

export default navigationRef
