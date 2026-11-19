import ServerAuthenticationScreen from './server-authentication'
import ServerAddressScreen from './server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { getUser } from '../../stores/auth/utils'
import QuickConnectScreen from './quick-connect'
import { isUndefined } from 'lodash'

const LoginStack = createNativeStackNavigator({
	initialRouteName: isUndefined(getUser()) ? 'ServerAuthentication' : 'LibrarySelection',
	screenOptions: {
		gestureEnabled: false,
	},
	screens: {
		ServerAddress: {
			screen: ServerAddressScreen,
			options: {
				headerShown: false,
			},
		},
		ServerAuthentication: {
			screen: ServerAuthenticationScreen,
			options: {
				title: '',
				headerBackButtonDisplayMode: 'minimal',
			},
		},
		QuickConnect: {
			screen: QuickConnectScreen,
		},
	},
})

export type LoginStackType = typeof LoginStack

export default LoginStack
