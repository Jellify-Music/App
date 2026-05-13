import _, { isUndefined } from 'lodash'
import ServerAuthentication from './server-authentication'
import ServerAddressScreen from './server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ServerLibrary from './server-library'
import { useMemo } from 'react'
import { useJellifyUser } from '../../stores/auth'
import { getServer, getUser } from '../../stores/auth/utils'

const LoginStack = createNativeStackNavigator({
	initialRouteName: isUndefined(getServer())
		? 'ServerAddress'
		: isUndefined(getUser())
			? 'ServerAuthentication'
			: 'LibrarySelection',
	screenOptions: {
		headerShown: false,
	},
	screens: {
		ServerAddress: {
			screen: ServerAddressScreen,
		},
		ServerAuthentication: {
			screen: ServerAuthentication,
		},
		LibrarySelection: {
			screen: ServerLibrary,
		},
	},
})

export default LoginStack
