import Tabs from './Tabs'
import { createNativeStackNavigator, createNativeStackScreen } from '@react-navigation/native-stack'
import OtaScreen from './Ota'
import { SizableText, YStack } from 'tamagui'
import Context from './Context'
import { getItemName } from '../utils/formatting/item-names'
import AddToPlaylistSheet from './AddToPlaylist'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'
import { getUser } from '../stores/auth/utils'
import DeletePlaylist from './Library/delete-playlist'
import { formatArtistNames } from '../utils/formatting/artist-names'
import {
	addToPlaylistSheetPresentation,
	bottomSheetPresentation,
	playerSheetPresentation,
} from '../utils/navigating/form-sheet'
import { createStaticNavigation, InitialState } from '@react-navigation/native'
import navigationRef from './navigation'
import { navigationIntegration } from '../utils/logging/sentry'
import { getJellifyNavTheme } from '../components/theme'
import { useColorPresetSetting, useThemeSetting } from '../stores/settings/app'
import { useColorScheme } from 'react-native'
import LoginStack from './Login'
import PlayerStack from './Player'
import { useState } from 'react'
import PrivacyPolicyScreen from './PrivacyPolicy'
import { Ticker } from '../components/Global/utils/Animated/text'
import i18n from '../i18n'

/**
 * The root navigation stack for Jellify. Contains all top level screens, such as the login screen
 * and the main tab navigator, as well as any modals or sheets that can be opened from anywhere in
 * the app (e.g. the player, context menu, filters, etc).
 */
export const RootStack = createNativeStackNavigator({
	screens: {
		Login: createNativeStackScreen({
			screen: LoginStack,
			options: {
				headerShown: false,
			},
		}),
		Tabs: createNativeStackScreen({
			screen: Tabs,
			options: {
				headerShown: false,
				gestureEnabled: false,
			},
		}),
		PlayerRoot: createNativeStackScreen({
			screen: PlayerStack,
			options: {
				// Android formSheet is unreliable on older SDKs; fallback to modal there
				// iOS formSheet will fuck up the display; fallback to modal
				presentation: playerSheetPresentation,
				sheetAllowedDetents: playerSheetPresentation === 'formSheet' ? [1.0] : undefined,
				headerShown: false,
			},
		}),
		Context: createNativeStackScreen({
			screen: Context,
			options: ({ route }) => ({
				header: () => ContextSheetHeader(route.params.item),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			}),
		}),
		AddToPlaylist: createNativeStackScreen({
			screen: AddToPlaylistSheet,
			options: {
				headerTitle: i18n.t('context.addToPlaylist'),
				presentation: addToPlaylistSheetPresentation,
				sheetAllowedDetents:
					addToPlaylistSheetPresentation === 'formSheet' ? [1.0] : undefined,
				sheetGrabberVisible: true,
			},
		}),
		AudioSpecs: createNativeStackScreen({
			screen: AudioSpecsSheet,
			options: ({ route }) => ({
				header: () => ContextSheetHeader(route.params.item),
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			}),
		}),
		DeletePlaylist: createNativeStackScreen({
			screen: DeletePlaylist,
			options: {
				title: i18n.t('context.deletePlaylist'),
				presentation: bottomSheetPresentation,
				headerShown: false,
				sheetGrabberVisible: true,
				sheetAllowedDetents: 'fitToContents',
			},
		}),
		PrivacyPolicy: createNativeStackScreen({
			screen: PrivacyPolicyScreen,
			options: {
				headerShown: false,
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		}),
		Ota: createNativeStackScreen({
			screen: OtaScreen,
			options: {
				headerShown: false,
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: 'fitToContents',
				sheetGrabberVisible: true,
			},
		}),
	},
})

const RootNavigation = createStaticNavigation(RootStack)

export default function Root(): React.JSX.Element {
	const [theme] = useThemeSetting()
	const [colorPreset] = useColorPresetSetting()

	const isDarkMode = useColorScheme() === 'dark'
	const resolvedMode = theme === 'system' ? (isDarkMode ? 'dark' : 'light') : theme

	// Resolved on mount rather than at module load, since Android can recreate the activity
	// (e.g. after switching app icons) while the JS runtime, and the user's session, live on
	const [initialState] = useState<InitialState>(() => ({
		routes: [{ name: getUser() ? 'Tabs' : 'Login' }],
	}))

	const onReady = () => navigationIntegration.registerNavigationContainer(navigationRef)

	return (
		<RootNavigation
			ref={navigationRef}
			initialState={initialState}
			theme={getJellifyNavTheme(colorPreset, resolvedMode)}
			onReady={onReady}
		/>
	)
}

function ContextSheetHeader(item: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap='1' marginVertical='4' alignItems='center'>
			<Ticker>
				<SizableText fontSize='5' fontWeight='6'>
					{getItemName(item)}
				</SizableText>
			</Ticker>

			{(item.ArtistItems?.length ?? 0) > 0 && (
				<Ticker>
					<SizableText fontSize='3' fontWeight='6'>
						{`${formatArtistNames(item.ArtistItems?.map((artist) => getItemName(artist)) ?? [])}`}
					</SizableText>
				</Ticker>
			)}
		</YStack>
	)
}
