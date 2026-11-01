import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { H6, SizableText, XStack, YStack } from 'tamagui'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/formatting/item-names'
import AddToPlaylistSheet from './AddToPlaylist'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../components/Player/component.config'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'
import { getApi, getLibrary } from '../stores/auth/utils'
import DeletePlaylist from './Library/delete-playlist'
import { formatArtistNames } from '../utils/formatting/artist-names'
import addPlaylistUsers from './Library/add-playlist-users'
import ItemImage from '../components/Global/components/image'
import {
	addToPlaylistSheetPresentation,
	bottomSheetPresentation,
	canUseFormSheet,
	playerSheetPresentation,
} from '../utils/navigating/form-sheet'
import { createStaticNavigation } from '@react-navigation/native'
import navigationRef from './navigation'
import { navigationIntegration } from '../utils/logging/sentry'
import { getJellifyNavTheme } from '../components/theme'
import { useColorPresetSetting, useThemeSetting } from '../stores/settings/app'
import { useColorScheme } from 'react-native'
import PlayerStack from './Player'
import LoginStack from './Login'
import PrivacyPolicyScreen from './PrivacyPolicy'

/**
 * The root navigation stack for Jellify. Contains all top level screens, such as the login screen
 * and the main tab navigator, as well as any modals or sheets that can be opened from anywhere in
 * the app (e.g. the player, context menu, filters, etc).
 */
const RootStack = createNativeStackNavigator<RootStackParamList>({
	initialRouteName: getApi() && getLibrary() ? 'Tabs' : 'Login',
	screens: {
		Login: {
			screen: LoginStack,
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
			screen: PlayerStack,
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
		PrivacyPolicy: {
			screen: PrivacyPolicyScreen,
			options: {
				headerShown: false,
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		},
		AddPlaylistUsers: {
			screen: addPlaylistUsers,
			options: ({ route }) => ({
				title: 'Add Playlist Users',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: canUseFormSheet ? [1.0] : undefined,
				sheetGrabberVisible: true,
				header: () => addPlaylistUsersHeader(route.params.playlist),
			}),
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
		<RootNavigation
			ref={navigationRef}
			theme={getJellifyNavTheme(colorPreset, resolvedMode)}
			onReady={() => navigationIntegration.registerNavigationContainer(navigationRef)}
		/>
	)
}

function ContextSheetHeader(item: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap='1' marginVertical='4' alignItems='center'>
			<TextTicker {...TextTickerConfig}>
				<H6 fontSize='4' fontWeight='6'>
					{getItemName(item)}
				</H6>
			</TextTicker>

			{(item.ArtistItems?.length ?? 0) > 0 && (
				<TextTicker {...TextTickerConfig}>
					<SizableText fontSize='3' fontWeight='6'>
						{`${formatArtistNames(item.ArtistItems?.map((artist) => getItemName(artist)) ?? [])}`}
					</SizableText>
				</TextTicker>
			)}
		</YStack>
	)
}

function addPlaylistUsersHeader(playlist: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap={'$2'} marginTop={'$4'} alignItems='center'>
			<SizableText fontSize='3' fontWeight='6'>
				Add Users to Playlist
			</SizableText>
			<XStack gap={'$2'}>
				<ItemImage
					item={playlist}
					width={'$12'}
					height={'$12'}
					imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
				/>

				<YStack gap={'$2'}>
					<TextTicker {...TextTickerConfig}>
						<SizableText fontSize='3' fontWeight='6'>
							{getItemName(playlist)}
						</SizableText>
					</TextTicker>
				</YStack>
			</XStack>
		</YStack>
	)
}
