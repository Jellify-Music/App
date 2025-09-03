import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client'
import LinearGradient from 'react-native-linear-gradient'
import { getTokenValue, useTheme, XStack, YStack, ZStack } from 'tamagui'
import FavoriteButton from '../Global/components/favorite-button'
import Icon from '../Global/components/icon'
import ItemImage from '../Global/components/image'
import InstantMixButton from '../Global/components/instant-mix-button'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import { H5 } from '../Global/helpers/text'
import Button from '../Global/helpers/button'

export default function ArtistHeader(
	artist: BaseItemDto,
	navigation: NativeStackNavigationProp<BaseStackParamList>,
): React.JSX.Element {
	const { width } = useSafeAreaFrame()

	const theme = useTheme()

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

			<YStack alignItems='center' marginHorizontal={'$2'} backgroundColor={'$background'}>
				<XStack
					alignItems='flex-end'
					justifyContent='flex-start'
					flex={1}
					marginHorizontal={'$2'}
				>
					<XStack alignItems='center' flex={1} justifyContent='space-between'>
						<H5 flexGrow={1} fontWeight={'bold'} maxWidth={'75%'}>
							{artist.Name}
						</H5>
					</XStack>
				</XStack>

				<XStack alignItems='center' flex={1} gap={'$2'}>
					<Button
						flex={1}
						icon={<Icon small name='play' />}
						color={'$primary'}
						onPress={() => {}}
						borderWidth={'$1'}
						borderColor={'$primary'}
					>
						Play all
					</Button>

					<Button
						flex={1}
						icon={<Icon small name='shuffle' onPress={() => {}} />}
						color={'$secondary'}
						onPress={() => {}}
						borderWidth={'$1'}
						borderColor={'$secondary'}
					>
						Shuffle
					</Button>
				</XStack>
			</YStack>
		</YStack>
	)
}
