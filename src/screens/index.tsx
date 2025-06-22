import Player from './Player'
import { Tabs } from './tabs'
import { StackParamList } from '../components/types'
import { useTheme } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from './Login'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Platform } from 'react-native'

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
					headerShown: false,
					presentation: 'formSheet',
					sheetAllowedDetents: Platform.OS === 'android' ? [1.0] : 'fitToContents',
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
