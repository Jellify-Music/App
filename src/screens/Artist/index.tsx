import { RouteProp, useIsFocused, useNavigation } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { ArtistProvider } from '../../providers/Artist'
import ActionPill from '../../components/Artist/action-pill'
import ArtistDownloadButton from '../../components/Artist/download-button'
import FavoriteButton from '../../components/Global/components/favorite-button'
import Icon from '../../components/Global/components/icon'
import { BaseStackParamList } from '../types'
import { ArtistTabsNavigation } from './tabs'
import { getBlurhashFromDto } from '../../utils/parsing/blurhash'
import {
	blurhashLuminance,
	LUMINANCE_CONTRAST_MIDPOINT,
} from '../../utils/parsing/blurhash-luminance'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	const { artist } = route.params

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const { top } = useSafeAreaInsets()

	const isFocused = useIsFocused()

	// The status bar sits on the artwork, so its icons follow how bright the image is up there, rather
	// than the app's theme. Without a blurhash to go by, the app's own style stands.
	const luminance = blurhashLuminance(
		// the header shows the artist's backdrop, or else their primary image: read the one on show
		getBlurhashFromDto(artist, ImageType.Backdrop) ||
			getBlurhashFromDto(artist, ImageType.Primary),
	)
	const statusBarStyle =
		luminance === undefined
			? undefined
			: luminance > LUMINANCE_CONTRAST_MIDPOINT
				? 'dark-content'
				: 'light-content'

	return (
		<ArtistProvider artist={artist}>
			<YStack flex={1}>
				{isFocused && statusBarStyle ? <StatusBar barStyle={statusBarStyle} /> : null}

				<ArtistTabsNavigation />

				{/* The stack's header is off so the image can run to the top of the screen; these stay put over it */}
				<XStack
					position='absolute'
					top={top + 8}
					left='$2'
					right='$2'
					justifyContent='space-between'
					pointerEvents='box-none'
				>
					<ActionPill circular>
						<Icon
							name='chevron-left'
							size='7'
							color='primary'
							onPress={() => navigation.goBack()}
							testID='artist-back-button'
						/>
					</ActionPill>

					<ActionPill>
						<ArtistDownloadButton />

						<FavoriteButton item={artist} />
					</ActionPill>
				</XStack>
			</YStack>
		</ArtistProvider>
	)
}
