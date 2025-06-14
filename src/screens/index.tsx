import Player from './Player'
import { Tabs } from './tabs'
import { StackParamList } from '../components/types'
import { useTheme } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from './Login'
import { createStackNavigator } from '@react-navigation/stack'

const RootStack = createStackNavigator<StackParamList>()

export default function Root(): React.JSX.Element {
	const theme = useTheme()

	const { api, library } = useJellifyContext()

	return (
		<RootStack.Navigator initialRouteName={api && library ? 'Tabs' : 'Login'}>
			<RootStack.Screen
				name='Tabs'
				component={Tabs}
				options={{
					headerShown: false,
				}}
			/>
			<RootStack.Screen
				name='Player'
				component={Player}
				options={{
					headerShown: false,
					presentation: 'transparentModal',
					cardOverlayEnabled: true,
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
