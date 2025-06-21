import _, { isUndefined } from 'lodash'
import ServerAuthentication from '../../components/Login/screens/server-authentication'
import ServerAddress from '../../components/Login/screens/server-address'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ServerLibrary from '../../components/Login/screens/server-library'
import { useJellifyContext } from '../../providers'

const LoginStack = createNativeStackNavigator()

/**
 * The login screen.
 * @returns The login screen.
 */
export default function Login(): React.JSX.Element {
	const { user, server } = useJellifyContext()

	return (
		<LoginStack.Navigator
			initialRouteName={
				isUndefined(server)
					? 'ServerAddress'
					: isUndefined(user)
						? 'ServerAuthentication'
						: 'LibrarySelection'
			}
			screenOptions={{ headerShown: false }}
		>
			<LoginStack.Screen
				name='ServerAddress'
				options={{
					headerShown: false,
				}}
				component={ServerAddress}
			/>

			<LoginStack.Screen
				name='ServerAuthentication'
				options={{
					headerShown: false,
				}}
				component={ServerAuthentication}
			/>
			<LoginStack.Screen
				name='LibrarySelection'
				options={{
					headerShown: false,
				}}
				component={ServerLibrary}
			/>
		</LoginStack.Navigator>
	)
}
