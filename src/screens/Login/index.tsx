import _, { isUndefined } from 'lodash'
import ServerAuthenticationScreen from './server-authentication'
import ServerAddressScreen from './server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ServerLibrary from './server-library'
import { getServer, getUser } from '../../stores/auth/utils'
import LoginStackParamList from './types'
import QuickConnectScreen from './quick-connect'

const LoginStack = createNativeStackNavigator<LoginStackParamList>({
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
			screen: ServerLibrary,
		},
	},
})

export default LoginStack
