import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { StackParamList } from '../types'
import TrackOptions from './helpers/TrackOptions'
import { getToken, getTokens, ScrollView, Spacer, useTheme, View, XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import FavoriteButton from '../Global/components/favorite-button'
import { useEffect } from 'react'
import { trigger } from 'react-native-haptic-feedback'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../Player/component.config'
import FastImage from 'react-native-fast-image'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import Icon from '../Global/components/icon'
import { Platform, useColorScheme } from 'react-native'
import JellifyToastConfig from '../../constants/toast.config'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '../../providers'
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

	const { api } = useJellifyContext()

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
					alignItems='flex-start'
					minHeight={getToken('$20') + getToken('$20')}
				>
					{/**
					 * Android needs a dismiss chevron here
					 */}
					{Platform.OS === 'android' ? (
						<Icon
							name='chevron-down'
							onPress={() => {
								navigation.goBack()
							}}
							small
						/>
					) : (
						<Spacer />
					)}

					<Spacer />

					<FastImage
						source={{
							uri: getImageApi(api!).getItemImageUrlById(
								item.Type === 'Audio' ? item.AlbumId! || item.Id! : item.Id!,
							),
						}}
						style={{
							width: getToken('$20') + getToken('$20'),
							height: getToken('$20') + getToken('$20'),
							borderRadius:
								item.Type === 'MusicArtist'
									? getToken('$20') + getToken('$20')
									: getToken('$5'),
						}}
					/>

					<Spacer />
					<Spacer />
				</XStack>

				{/* Item Name, Artist, Album, and Favorite Button */}
				<XStack maxWidth={getToken('$20') + getToken('$20') + getToken('$5')}>
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
								color={getTokens().color.telemagenta}
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

						<TextTicker {...TextTickerConfig}>
							<Text fontSize={'$6'} color={'$borderColor'}>
								{item.Album ?? ''}
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
