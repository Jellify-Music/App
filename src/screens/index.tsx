import Player from './Player'
import { Tabs } from './tabs'
import { StackParamList } from '../components/types'
import { useTheme } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from './Login'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const RootStack = createNativeStackNavigator<StackParamList>()

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
					animation: 'slide_from_bottom',
					headerShown: false,
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
