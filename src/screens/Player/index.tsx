import React from 'react'
import { StackParamList } from '../../components/types'
import PlayerScreen from '../../components/Player'
import Queue from '../../components/Player/queue'
import DetailsScreen from '../Detail'
import { createStackNavigator } from '@react-navigation/stack'

export const PlayerStack = createStackNavigator<StackParamList>()

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
				name='Queue'
				component={Queue}
				options={{
					headerTitle: '',
				}}
			/>

			<PlayerStack.Screen
				name='Details'
				component={DetailsScreen}
				options={{
					headerTitle: '',
				}}
			/>
		</PlayerStack.Navigator>
	)
}
