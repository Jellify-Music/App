import Tabs from './Tabs'
import { RootStackParamList } from './types'
import { SizableText, XStack, YStack } from 'tamagui'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Context from './Context'
import { getItemName } from '../utils/formatting/item-names'
import AddToPlaylistSheet from './AddToPlaylist'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import AudioSpecsSheet from './Stats'
import { getUser } from '../stores/auth/utils'
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
import { createStaticNavigation, InitialState } from '@react-navigation/native'
import navigationRef from './navigation'
import { navigationIntegration } from '../utils/logging/sentry'
import { getJellifyNavTheme } from '../components/theme'
import { useColorPresetSetting, useThemeSetting } from '../stores/settings/app'
import { useColorScheme } from 'react-native'
import { useState } from 'react'
import PlayerStack from './Player'
import LoginStack from './Login'
import PrivacyPolicyScreen from './PrivacyPolicy'
import { Ticker } from '../components/Global/utils/Animated/text'

/**
 * The root navigation stack for Jellify. Contains all top level screens, such as the login screen
 * and the main tab navigator, as well as any modals or sheets that can be opened from anywhere in
 * the app (e.g. the player, context menu, filters, etc).
 */
const RootStack = createNativeStackNavigator<RootStackParamList>({
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
				title: 'Share Playlist',
				presentation: bottomSheetPresentation,
				sheetAllowedDetents: canUseFormSheet ? [1.0] : undefined,
				sheetGrabberVisible: true,
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

function addPlaylistUsersHeader(playlist: BaseItemDto): React.JSX.Element {
	return (
		<YStack gap={'$2'} marginTop={'$4'} alignItems='center' flex={1}>
			<SizableText fontSize='3' fontWeight='6'>
				Share Playlist
			</SizableText>
			<XStack gap='2' flex={1} justifyContent='flex-start'>
				<ItemImage
					item={playlist}
					width={'6'}
					height={'6'}
					imageOptions={{ maxWidth: 150, maxHeight: 150 }}
					elevate
				/>

				<YStack gap={'$2'}>
					<Ticker>
						<SizableText fontSize='3' fontWeight='6'>
							{getItemName(playlist)}
						</SizableText>
					</Ticker>
				</YStack>
			</XStack>
		</YStack>
	)
}
