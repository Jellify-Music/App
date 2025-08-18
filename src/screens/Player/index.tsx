import React from 'react'
import PlayerScreen from '../../components/Player'
import Queue from '../../components/Player/queue'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MultipleArtistsSheet from '../Context/multiple-artists'
import { PlayerParamList } from './types'

export const PlayerStack = createNativeStackNavigator<PlayerParamList>()

export default function Player(): React.JSX.Element {
	return (
		<PlayerStack.Navigator initialRouteName='PlayerScreen'>
			<PlayerStack.Screen
				name='PlayerScreen'
				component={PlayerScreen}
				options={{
					headerShown: false,
					headerTitle: '',
				}}
			/>

			<PlayerStack.Screen
				name='QueueScreen'
				component={Queue}
				options={{
					headerTitle: '',
				}}
			/>

			<PlayerStack.Screen
				name='MultipleArtistsSheet'
				component={MultipleArtistsSheet}
				options={{
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
					headerShown: false,
				}}
			/>
		</PlayerStack.Navigator>
	)
}
