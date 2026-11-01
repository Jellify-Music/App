import TextTicker from 'react-native-text-ticker'
import { H6, Paragraph, SizableText, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import React from 'react'
import FavoriteButton from '../../Global/components/favorite-button'
import Icon from '../../Global/components/icon'
import { StackActions, useNavigation } from '@react-navigation/native'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { useCurrentTrack } from '../../../stores/player/queue'
import { isExplicit } from '../../../utils/trackDetails'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { useAlbum } from '../../../api/queries/album'
import { RootStackParamList } from '@/src/screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { PlayerParamList } from '@/src/screens/Player/types'
import navigationRef from '../../../screens/navigation'
import { useIsHolidays } from '../../Holidays/hooks'

export default function SongInfo(): React.JSX.Element {
	const currentTrack = useCurrentTrack()

	const isHolidays = useIsHolidays()

	const rootStackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const playerStackNavigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const item = getTrackDto(currentTrack)

	const { data: album } = useAlbum(
		item && item.AlbumId ? ({ Id: item.AlbumId } as BaseItemDto) : ({} as BaseItemDto),
	)

	// Memoize expensive computations
	const trackTitle = currentTrack?.title ?? 'Untitled Track'

	const handleTrackPress = () => {
		if (album) {
			playerStackNavigation.pop()
			navigationRef.dispatch(
				StackActions.push('Album', {
					album,
				}),
			)
		}
	}

	const handleArtistPress = () => {
		if (item?.ArtistItems) {
			if (item.ArtistItems.length > 1) {
				playerStackNavigation.navigate('MultipleArtistsSheet', {
					artists: item.ArtistItems,
				})
			} else {
				playerStackNavigation.pop()
				navigationRef.dispatch(
					StackActions.push('Artist', {
						artist: item.ArtistItems[0],
					}),
				)
			}
		}
	}

	const openContextMenu = () =>
		currentTrack &&
		item &&
		rootStackNavigation.navigate('Context', {
			item,
			streamingMediaSourceInfo:
				currentTrack.extraPayload?.sourceType === 'stream'
					? (currentTrack.extraPayload?.mediaSourceInfo as MediaSourceInfo)
					: undefined,
			downloadedMediaSourceInfo:
				currentTrack.extraPayload?.sourceType === 'download'
					? (currentTrack.extraPayload?.mediaSourceInfo as MediaSourceInfo)
					: undefined,
		})

	return (
		<XStack>
			<YStack justifyContent='flex-start' flex={1}>
				<Animated.View
					entering={FadeIn.easing(Easing.in(Easing.ease))}
					exiting={FadeOut.easing(Easing.out(Easing.ease))}
					key={`${currentTrack?.id ?? 'unknown-track'}-song-info`}
				>
					<YStack gap={'1'}>
						<TextTicker
							{...TextTickerConfig}
							key={`${currentTrack?.id ?? 'no-track'}-title`}
						>
							<SizableText
								fontSize='4'
								fontWeight='6'
								{...ICON_PRESS_STYLES}
								onPress={handleTrackPress}
							>
								{trackTitle}
							</SizableText>
						</TextTicker>

						<TextTicker
							{...TextTickerConfig}
							key={`${currentTrack?.id ?? 'no-track'}-artist`}
						>
							<SizableText
								fontSize='4'
								{...ICON_PRESS_STYLES}
								onPress={handleArtistPress}
							>
								{currentTrack?.artist ?? 'Unknown Artist'}
							</SizableText>
							{isExplicit(item) && (
								<XStack alignSelf='center' paddingTop={5.3} paddingLeft='1'>
									<Icon name='alpha-e-box-outline' color={'color'} size='5' />
								</XStack>
							)}
						</TextTicker>
					</YStack>
				</Animated.View>
			</YStack>

			<XStack
				justifyContent='flex-end'
				alignItems='center'
				flexShrink={1}
				gap={isHolidays ? 12 : '3'}
				paddingLeft={'1'}
			>
				{/* Holidays: the design seats both buttons in 44px boxes, 12px apart */}
				{currentTrack && item && (
					<YStack
						width={isHolidays ? 44 : undefined}
						height={isHolidays ? 44 : undefined}
						alignItems='center'
						justifyContent='center'
					>
						<FavoriteButton item={item} />
					</YStack>
				)}

				<YStack
					width={isHolidays ? 44 : undefined}
					height={isHolidays ? 44 : undefined}
					alignItems='center'
					justifyContent='center'
				>
					<Icon name='dots-horizontal-circle-outline' onPress={openContextMenu} />
				</YStack>
			</XStack>
		</XStack>
	)
}
