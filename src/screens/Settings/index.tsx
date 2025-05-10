import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Settings from '../../components/Settings/component'
import SignOutModal from './sign-out-modal'
import { SettingsStackParamList } from './types'

export const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

export default function SettingsScreen(): React.JSX.Element {
	return (
		<SettingsStack.Navigator
			initialRouteName='Settings'
			screenOptions={{
				headerShown: false,
			}}
		>
			<SettingsStack.Screen name='Settings' component={Settings} />

			<SettingsStack.Screen
				name='SignOut'
				component={SignOutModal}
				options={{
					/* https://www.reddit.com/r/reactnative/comments/1dgktbn/comment/lxd23sj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button */
					presentation: 'formSheet',
					sheetInitialDetentIndex: 0,
					sheetAllowedDetents: [0.2],
				}}
			/>
		</SettingsStack.Navigator>
	)
}
