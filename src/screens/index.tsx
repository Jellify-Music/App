import Player, { PlayerStack } from './Player'
import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { getToken, useTheme, YStack } from 'tamagui'
import { useJellifyContext } from '../providers'
import Login from './Login'
import { createNativeStackNavigator, NativeStackHeaderProps } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/text'
import AddToPlaylistSheet from './AddToPlaylist'
import { Platform } from 'react-native'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../components/Player/component.config'
import { Text } from '../components/Global/helpers/text'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export default function Root(): React.JSX.Element {
	const theme = useTheme()

	const { api, library } = useJellifyContext()

	const isApple = ['ios', 'macos'].includes(Platform.OS)

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
					header: () => ContextSheetHeader(route.params.item),
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
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

			<RootStack.Screen
				name='AudioSpecs'
				component={AudioSpecsSheet}
				options={({ route }) => ({
					header: () => ContextSheetHeader(route.params.item),
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
				})}
			/>
		</RootStack.Navigator>
	)
}

function ContextSheetHeader(item: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap={'$1'} marginTop={'$4'} alignItems='center'>
			<TextTicker {...TextTickerConfig}>
				<Text bold fontSize={'$6'}>
					{getItemName(item)}
				</Text>
			</TextTicker>

			{(item.ArtistItems?.length ?? 0) > 0 && (
				<TextTicker {...TextTickerConfig}>
					<Text bold fontSize={'$4'}>
						{`${item.ArtistItems?.map((artist) => getItemName(artist)).join(' • ')}`}
					</Text>
				</TextTicker>
			)}
		</YStack>
	)
}
