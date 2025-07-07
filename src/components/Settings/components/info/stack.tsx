import InfoTabIndex from '.'
import InfoTabStorage from './storage'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
const infoStack = createNativeStackNavigator()

export default function InfoStack() {
	return (
		<infoStack.Navigator>
			<infoStack.Screen
				name='Index'
				component={InfoTabIndex}
				options={{
					headerShown: false,
				}}
			/>

			<infoStack.Screen
				name='Storage'
				component={InfoTabStorage}
				options={{
					headerShown: false,
				}}
			/>
		</infoStack.Navigator>
	)
}
