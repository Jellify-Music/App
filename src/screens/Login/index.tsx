import ServerAuthenticationScreen from './server-authentication'
import ServerAddressScreen from './server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginStackParamList from './types'
import QuickConnectScreen from './quick-connect'

const LoginStack = createNativeStackNavigator<LoginStackParamList>({
	initialRouteName: 'ServerAddress',
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

export default LoginStack
