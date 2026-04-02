import Player from './Player'
import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { Paragraph, useTheme, YStack } from 'tamagui'
import Login from './Login'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/formatting/item-names'
import AddToPlaylistSheet from './AddToPlaylist'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../components/Player/component.config'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'
import { useApi, useJellifyLibrary } from '../stores'
import DeletePlaylist from './Library/delete-playlist'
import { Platform } from 'react-native'
import { formatArtistNames } from '../utils/formatting/artist-names'
import FiltersSheet from './Filters'
import SortOptionsSheet from './SortOptions'
import GenreSelectionScreen from './GenreSelection'
import YearSelectionScreen from './YearSelection'
import MigrateDownloadsScreen from './MigrateDownloads'

const RootStack = createNativeStackNavigator<RootStackParamList>()

export default function Root(): React.JSX.Element {
	const theme = useTheme()

	const api = useApi()
	const [library] = useJellifyLibrary()

	return (
		<RootStack.Navigator initialRouteName={api && library ? 'Tabs' : 'Login'}>
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
					// Form Sheet gives swipe to dismiss for Android, but royally fucks up the display on iOS
					presentation: Platform.OS === 'android' ? 'formSheet' : 'modal',
					sheetAllowedDetents: Platform.OS === 'android' ? [1.0] : undefined,
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
					presentation: 'modal',
					sheetGrabberVisible: true,
				}}
			/>

			<RootStack.Screen
				name='Filters'
				component={FiltersSheet}
				options={{
					headerTitle: 'Filters',
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					sheetGrabberVisible: true,
				}}
			/>

			<RootStack.Screen
				name='SortOptions'
				component={SortOptionsSheet}
				options={{
					headerTitle: 'Sort',
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

			<RootStack.Screen
				name='DeletePlaylist'
				component={DeletePlaylist}
				options={{
					title: 'Delete Playlist',
					presentation: 'formSheet',
					headerShown: false,
					sheetGrabberVisible: true,
					sheetAllowedDetents: 'fitToContents',
				}}
			/>

			<RootStack.Screen
				name='GenreSelection'
				component={GenreSelectionScreen}
				options={{
					headerTitle: 'Select Genres',
					presentation: 'modal',
					sheetGrabberVisible: true,
				}}
			/>

			<RootStack.Screen
				name='YearSelection'
				component={YearSelectionScreen}
				options={{
					headerTitle: 'Year range',
					presentation: 'modal',
					sheetGrabberVisible: true,
				}}
			/>

			<RootStack.Screen
				name='MigrateDownloads'
				component={MigrateDownloadsScreen}
				options={{
					headerTitle: 'Migrate Downloads',
					presentation: 'formSheet',
					sheetAllowedDetents: 'fitToContents',
					headerShown: false,
				}}
			/>
		</RootStack.Navigator>
	)
}

function ContextSheetHeader(item: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap={'$1'} marginTop={'$4'} alignItems='center'>
			<TextTicker {...TextTickerConfig}>
				<Paragraph fontWeight={'$6'} fontSize={'$6'}>
					{getItemName(item)}
				</Paragraph>
			</TextTicker>

			{(item.ArtistItems?.length ?? 0) > 0 && (
				<TextTicker {...TextTickerConfig}>
					<Paragraph fontWeight={'$6'} fontSize={'$4'}>
						{`${formatArtistNames(item.ArtistItems?.map((artist) => getItemName(artist)) ?? [])}`}
					</Paragraph>
				</TextTicker>
			)}
		</YStack>
	)
}
