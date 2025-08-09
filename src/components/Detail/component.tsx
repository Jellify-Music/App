import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import TrackOptions from './helpers/TrackOptions'
import { getToken, ScrollView, Spacer, useTheme, View, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import FavoriteButton from '../Global/components/favorite-button'
import { useEffect } from 'react'
import { trigger } from 'react-native-haptic-feedback'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import JellifyToastConfig from '../../constants/toast.config'
import Toast from 'react-native-toast-message'
import ItemImage from '../Global/components/image'
export default function ItemDetail({
	item,
	navigation,
	isNested,
}: {
	item: BaseItemDto
	navigation: NativeStackNavigationProp<StackParamList>
	isNested?: boolean | undefined
}): React.JSX.Element {
	let options: React.JSX.Element | undefined = undefined

	useEffect(() => {
		trigger('impactMedium')
	}, [item])

	const theme = useTheme()

	switch (item.Type) {
		case 'Audio': {
			options = TrackOptions({ track: item, navigation, isNested })
			break
		}

		case 'MusicAlbum': {
			break
		}

		case 'MusicArtist': {
			break
		}

		case 'Playlist': {
			break
		}

		default: {
			break
		}
	}

	return (
		<ScrollView contentInsetAdjustmentBehavior='automatic' removeClippedSubviews>
			<YStack alignItems='center' flex={1} marginTop={'$4'}>
				<XStack
					justifyContent='center'
					alignItems='center'
					minHeight={getToken('$20') * 1.5}
				>
					<ItemImage
						item={item}
						width={getToken('$20') * 1.5}
						height={getToken('$20') * 1.5}
						circular={item.Type === 'MusicArtist'}
					/>
				</XStack>

				{/* Item Name, Artist, Album, and Favorite Button */}
				<XStack maxWidth={getToken('$20') * 1.5}>
					<YStack
						marginLeft={'$0.5'}
						alignItems='flex-start'
						alignContent='flex-start'
						justifyContent='flex-start'
						flex={3}
					>
						<TextTicker {...TextTickerConfig}>
							<Text bold fontSize={'$6'}>
								{item.Name ?? 'Untitled Track'}
							</Text>
						</TextTicker>

						<TextTicker {...TextTickerConfig}>
							<Text
								fontSize={'$6'}
								onPress={() => {
									if (item.ArtistItems) {
										if (isNested) navigation.getParent()!.goBack()

										navigation.goBack()
										navigation.navigate('Artist', {
											artist: item.ArtistItems[0],
										})
									}
								}}
							>
								{item.Artists?.join(', ') ?? 'Unknown Artist'}
							</Text>
						</TextTicker>
					</YStack>

					<YStack flex={1} alignItems='flex-end' justifyContent='center'>
						<FavoriteButton item={item} />
					</YStack>
				</XStack>

				<Spacer />

				{options ?? <View />}
			</YStack>
			<Toast config={JellifyToastConfig(theme)} />
		</ScrollView>
	)
}
