import { createNavigationContainerRef } from '@react-navigation/native'
import { RootStackParamList } from '../screens/types'

const navigationRef = createNavigationContainerRef<RootStackParamList>()

export default navigationRef
