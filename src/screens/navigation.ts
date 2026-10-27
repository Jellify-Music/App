import { createNavigationContainerRef } from '@react-navigation/native'
import { RootStackParamList } from './types'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'

const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const stackScreenOptions: NativeStackNavigationOptions = {
	headerTitleAlign: 'center',
	headerTitleStyle: {
		fontFamily: 'Figtree-Bold',
	},
}

export default navigationRef
