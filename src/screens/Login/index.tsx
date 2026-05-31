import { isUndefined } from 'lodash'
import ServerAuthenticationScreen from './server-authentication'
import ServerAddressScreen from './server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ServerLibraryScreen from './server-library'
import { getServer, getUser } from '../../stores/auth/utils'
import QuickConnectScreen from './quick-connect'

const LoginStack = createNativeStackNavigator({
	initialRouteName: isUndefined(getServer())
		? 'ServerAddress'
		: isUndefined(getUser())
			? 'ServerAuthentication'
			: 'LibrarySelection',
	screenOptions: {
		headerShown: false,
		gestureEnabled: false,
	},
	screens: {
		ServerAddress: {
			screen: ServerAddressScreen,
			options: {
				animationTypeForReplace: 'pop',
			},
		},
		ServerAuthentication: {
			screen: ServerAuthenticationScreen,
		},
		QuickConnect: {
			screen: QuickConnectScreen,
		},
		LibrarySelection: {
			screen: ServerLibraryScreen,
		},
	},
})

export type LoginStackType = typeof LoginStack

export default LoginStack
