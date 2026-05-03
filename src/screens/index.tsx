import Player from './Player'
import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { Paragraph, YStack } from 'tamagui'
import Login from './Login'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/formatting/item-names'
import AddToPlaylistSheet from './AddToPlaylist'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../components/Player/component.config'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'
import { getApi, getLibrary } from '../stores'
import DeletePlaylist from './Library/delete-playlist'
import { formatArtistNames } from '../utils/formatting/artist-names'
import FiltersSheet from './Filters'
import SortOptionsSheet from './SortOptions'
import GenreSelectionScreen from './GenreSelection'
import YearSelectionScreen from './YearSelection'
import MigrateDownloadsScreen from './MigrateDownloads'
import {
	addToPlaylistSheetPresentation,
	bottomSheetPresentation,
	playerSheetPresentation,
} from '../utils/navigating/form-sheet'
import { createStaticNavigation } from '@react-navigation/native'
import navigationRef from './navigation'
import { getJellifyNavTheme } from '../components/theme'
import { useColorPresetSetting, useThemeSetting } from '../stores/settings/app'
import { useColorScheme } from 'react-native'

/**
 * The root navigation stack for Jellify. Contains all top level screens, such as the login screen
 * and the main tab navigator, as well as any modals or sheets that can be opened from anywhere in
 * the app (e.g. the player, context menu, filters, etc).
 */
const RootStack = createNativeStackNavigator<RootStackParamList>({
	initialRouteName: getApi() && getLibrary() ? 'Tabs' : 'Login',
	screens: {
		Login: {
			screen: Login,
			options: {
				headerShown: false,
			},
		},
		Tabs: {
			screen: Tabs,
			options: {
				headerShown: false,
				gestureEnabled: false,
			},
		},
		PlayerRoot: {
			screen: Player,
			options: {
				// Android formSheet is unreliable on older SDKs; fallback to modal there
				// iOS formSheet will fuck up the display; fallback to modal
				presentation: playerSheetPresentation,
				sheetAllowedDetents: playerSheetPresentation === 'formSheet' ? [1.0] : undefined,
				headerShown: false,
			},
		},
		Context: {
			screen: Context,
			options: ({ route }) => ({
				header: () => ContextSheetHeader(route.params.item),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			}),
		},
		AddToPlaylist: {
			screen: AddToPlaylistSheet,
			options: {
				headerTitle: 'Add to Playlist',
				presentation: addToPlaylistSheetPresentation,
				sheetAllowedDetents:
					addToPlaylistSheetPresentation === 'formSheet' ? [1.0] : undefined,
				sheetGrabberVisible: true,
			},
		},
		Filters: {
			screen: FiltersSheet,
			options: {
				headerTitle: 'Filters',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		SortOptions: {
			screen: SortOptionsSheet,
			options: {
				headerTitle: 'Sort',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		AudioSpecs: {
			screen: AudioSpecsSheet,
			options: ({ route }) => ({
				header: () => ContextSheetHeader(route.params.item),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			}),
		},
		DeletePlaylist: {
			screen: DeletePlaylist,
			options: {
				title: 'Delete Playlist',
				presentation: bottomSheetPresentation,
				headerShown: false,
				sheetGrabberVisible: true,
				sheetAllowedDetents: 'fitToContents',
			},
		},
		GenreSelection: {
			screen: GenreSelectionScreen,
			options: {
				headerTitle: 'Select Genres',
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		YearSelection: {
			screen: YearSelectionScreen,
			options: {
				headerTitle: 'Year range',
				presentation: 'modal',
				sheetGrabberVisible: true,
			},
		},
		MigrateDownloads: {
			screen: MigrateDownloadsScreen,
			options: {
				headerTitle: 'Migrate Downloads',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				headerShown: false,
			},
		},
	},
})

const RootNavigation = createStaticNavigation(RootStack)

export default function Root(): React.JSX.Element {
	const [theme] = useThemeSetting()
	const [colorPreset] = useColorPresetSetting()

	const isDarkMode = useColorScheme() === 'dark'
	const resolvedMode = theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme

	return (
		<RootNavigation ref={navigationRef} theme={getJellifyNavTheme(colorPreset, resolvedMode)} />
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
