import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import PlayerScreen from '../../components/Player'
import Queue from '../../components/Queue'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useNavigationState } from '@react-navigation/native'
import MultipleArtistsSheet from '../Context/multiple-artists'
import { PlayerParamList } from './types'
import Lyrics from '../../components/Player/components/lyrics'
import usePlayerDisplayStore from '../../stores/player/display'
import Miniplayer from '../../components/Player/mini-player'
import { useTheme } from 'tamagui'

const PlayerStack = createNativeStackNavigator<PlayerParamList>()

function useIsOnLyricsScreen(): boolean {
	return useNavigationState((state) => {
		if (!state?.routes) return false
		const route = state.routes[state.index]
		if (route?.name !== 'PlayerRoot') return false
		const nestedState = route.state as { routes?: { name: string }[]; index?: number } | undefined
		if (!nestedState?.routes || nestedState.index === undefined) return false
		const currentName = nestedState.routes[nestedState.index]?.name
		return currentName === 'LyricsScreen'
	})
}

export default function Player(): React.JSX.Element {
	const [hasVisitedLyrics, setHasVisitedLyrics] = useState(false)
	const isOnLyricsScreen = useIsOnLyricsScreen()
	const theme = useTheme()
	const themeKey = `${theme.background.val}-${theme.primary.val}`

	useEffect(() => {
		if (isOnLyricsScreen) {
			setHasVisitedLyrics(true)
		}
	}, [isOnLyricsScreen])

	useEffect(() => {
		usePlayerDisplayStore.getState().setIsPlayerFocused(true)

		return () => usePlayerDisplayStore.getState().setIsPlayerFocused(false)
	}, [])

	return (
		<View style={{ flex: 1 }}>
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
				name='LyricsScreen'
				component={Lyrics}
				options={{
					headerTitle: '',
					headerShown: false,
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

			{/* Miniplayer overlay for Lyrics - kept mounted once visited to avoid remount crashes */}
			{hasVisitedLyrics && (
				<View
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						opacity: isOnLyricsScreen ? 1 : 0,
						pointerEvents: isOnLyricsScreen ? 'auto' : 'none',
					}}
				>
					<Miniplayer key={themeKey} disableAnimations />
					<View style={{ height: 40, backgroundColor: theme.background.val, borderTopWidth: 1, borderTopColor: theme.borderColor.val }} />
				</View>
			)}
		</View>
	)
}
