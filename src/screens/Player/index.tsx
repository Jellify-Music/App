import React from 'react'
import { StackParamList } from '../../components/types'
import PlayerScreen from '../../components/Player'
import Queue from '../../components/Player/queue'
import DetailsScreen from '../Detail'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MultipleArtistsSheet from '../Context/multiple-artists'

export const PlayerStack = createNativeStackNavigator<StackParamList>()

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

			<PlayerStack.Group
				screenOptions={{
					presentation: 'formSheet',
					sheetAllowedDetents: [0.2],
				}}
			>
				<PlayerStack.Screen
					name='MultipleArtists'
					component={MultipleArtistsSheet}
					options={{
						headerShown: false,
					}}
				/>
			</PlayerStack.Group>
		</PlayerStack.Navigator>
	)
}
