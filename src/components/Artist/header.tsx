import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client'
import LinearGradient from 'react-native-linear-gradient'
import { getTokenValue, useTheme, XStack, YStack, ZStack } from 'tamagui'
import Icon from '../Global/components/icon'
import ItemImage from '../Global/components/image'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { H5 } from '../Global/helpers/text'
import Button from '../Global/helpers/button'
import { useArtistContext } from '../../providers/Artist'
import FavoriteButton from '../Global/components/favorite-button'
import InstantMixButton from '../Global/components/instant-mix-button'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import IconButton from '../Global/helpers/icon-button'

export default function ArtistHeader(): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const { artist } = useArtistContext()

	const theme = useTheme()

	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()

	return (
		<YStack flex={1}>
			<ZStack flex={1} height={getTokenValue('$20')}>
				<ItemImage
					item={artist}
					width={width}
					height={'$20'}
					type={ImageType.Backdrop}
					cornered
				/>

				<LinearGradient
					colors={['transparent', theme.background.val]}
					style={{
						flex: 1,
					}}
				/>
			</ZStack>

			<YStack alignItems='center' marginHorizontal={'$3'} backgroundColor={'$background'}>
				<XStack alignItems='flex-end' justifyContent='flex-start' flex={1}>
					<XStack alignItems='center' flex={1} justifyContent='space-between'>
						<H5 flexGrow={1} fontWeight={'bold'} maxWidth={'75%'}>
							{artist.Name}
						</H5>
					</XStack>
				</XStack>

				<XStack alignItems='center' justifyContent='space-between' flex={1}>
					<XStack alignItems='center' gap={'$3'} flex={1}>
						<FavoriteButton item={artist} />

						<InstantMixButton item={artist} navigation={navigation} />
					</XStack>

					<XStack alignItems='center' justifyContent='flex-end' gap={'$3'} flex={1}>
						<Icon name='shuffle' onPress={() => {}} />
						<IconButton circular name='play' onPress={() => {}} />
					</XStack>
				</XStack>
			</YStack>
		</YStack>
	)
}
