import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Player from '../screens/Player'
import { Tabs } from './tabs'
import { StackParamList } from './types'
import { useTheme } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from '../screens/Login'
const RootStack = createNativeStackNavigator<StackParamList>()

export default function Navigation(): React.JSX.Element {
	const theme = useTheme()

	const { api, library } = useJellifyContext()

	return (
		<RootStack.Navigator initialRouteName={api && library ? 'Tabs' : 'Login'}>
			<RootStack.Screen
				name='Tabs'
				component={Tabs}
				options={{
					headerShown: false,
					navigationBarColor: theme.background.val,
					gestureEnabled: false,
				}}
			/>
			<RootStack.Screen
				name='Player'
				component={Player}
				options={{
					headerShown: false,
					presentation: 'modal',
				}}
			/>
			<RootStack.Screen
				name='Login'
				component={Login}
				options={{
					headerShown: false,
				}}
			/>
		</RootStack.Navigator>
	)
}
