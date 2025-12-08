import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Settings from '../../components/Settings/component'
import SignOutModal from './sign-out-modal'
import LibrarySelectionScreen from './library-selection'
import StorageManagementScreen from './storage-management'
import StorageSelectionModal from './storage-selection-modal'
import { SettingsStackParamList } from './types'

export const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

export default function SettingsScreen(): React.JSX.Element {
	return (
		<SettingsStack.Navigator
			initialRouteName='Settings'
			screenOptions={{
				headerShown: false,
				headerTitleStyle: {
					fontFamily: 'Figtree-Bold',
				},
			}}
		>
			<SettingsStack.Screen name='Settings' component={Settings} />

			<SettingsStack.Screen
				name='LibrarySelection'
				component={LibrarySelectionScreen}
				options={{
					title: 'Select Library',
				}}
			/>

			<SettingsStack.Screen
				name='SignOut'
				component={SignOutModal}
				options={{
					/* https://www.reddit.com/r/reactnative/comments/1dgktbn/comment/lxd23sj/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button */
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
					headerShown: false,
				}}
			/>
			<SettingsStack.Screen
				name='StorageManagement'
				component={StorageManagementScreen}
				options={{
					title: 'Storage Management',
					animation: 'slide_from_right',
					headerShown: true,
				}}
			/>
			<SettingsStack.Screen
				name='StorageSelectionReview'
				component={StorageSelectionModal}
				options={{
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
					headerShown: false,
				}}
			/>
		</SettingsStack.Navigator>
	)
}
