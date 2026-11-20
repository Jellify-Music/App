import { RouteProp, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { ArtistProvider } from '../../providers/Artist'
import ActionPill from '../../components/Artist/action-pill'
import FavoriteButton from '../../components/Global/components/favorite-button'
import Icon from '../../components/Global/components/icon'
import { BaseStackParamList } from '../types'
import { ArtistTabsNavigation } from './tabs'

export default function ArtistScreen({
	route,
}: {
	route: RouteProp<BaseStackParamList, 'Artist'>
}): React.JSX.Element {
	const { artist } = route.params

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	const { top } = useSafeAreaInsets()

	return (
		<ArtistProvider artist={artist}>
			<YStack flex={1}>
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
					<ActionPill>
						<Icon
							name='chevron-left'
							size='7'
							color='primary'
							onPress={() => navigation.goBack()}
							testID='artist-back-button'
						/>
					</ActionPill>

					<ActionPill>
						<FavoriteButton item={artist} />
					</ActionPill>
				</XStack>
			</YStack>
		</ArtistProvider>
	)
}
