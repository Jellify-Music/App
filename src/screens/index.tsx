import Player from './Player'
import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { getToken, useTheme } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from './Login'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/text'
import { useCallback } from 'react'
import AddToPlaylistSheet from './AddToPlaylist'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export default function Root(): React.JSX.Element {
	const theme = useTheme()

	const { api, library } = useJellifyContext()

	const getContextSheetDetents = useCallback(
		(artists: string[] | null | undefined, type: BaseItemKind | undefined) => {
			let detent: number = 0

			switch (type) {
				case 'Audio':
					detent = 0.3
					break
				case 'MusicAlbum':
					detent = 0.25
					break
				case 'Playlist':
					detent = 0.2
					break
				default:
					detent = 0.15
			}
			return [detent + (artists?.length ?? 1) * 0.075]
		},
		[],
	)

	return (
		<RootStack.Navigator
			initialRouteName={api && library ? 'Tabs' : 'Login'}
			screenOptions={({ route }) => ({
				navigationBarColor:
					route.name === 'PlayerRoot' ? getToken('$black') : theme.background.val,
			})}
		>
			<RootStack.Screen
				name='Tabs'
				component={Tabs}
				options={{
					headerShown: false,
					navigationBarColor: theme.background.val,
					gestureEnabled: false,
				}}
			/>
			<RootStack.Screen
				name='PlayerRoot'
				component={Player}
				options={{
					presentation: 'modal',
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

			<RootStack.Screen
				name='Context'
				component={Context}
				options={({ route }) => ({
					headerTitle: getItemName(route.params.item),
					presentation: 'formSheet',
					sheetAllowedDetents: getContextSheetDetents(
						route.params.item.Artists,
						route.params.item.Type,
					),
					sheetGrabberVisible: true,
					headerTransparent: true,
				})}
			/>

			<RootStack.Screen
				name='AddToPlaylist'
				component={AddToPlaylistSheet}
				options={{
					headerTitle: 'Add to Playlist',
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
				}}
			/>
		</RootStack.Navigator>
	)
}
