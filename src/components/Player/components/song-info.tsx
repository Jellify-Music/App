import TextTicker from 'react-native-text-ticker'
import { Paragraph, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import React from 'react'
import FavoriteButton from '../../Global/components/favorite-button'
import navigationRef from '../../../screens/navigation'
import Icon from '../../Global/components/icon'
import { CommonActions } from '@react-navigation/native'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { useCurrentTrack } from '../../../stores/player/queue'
import { isExplicit } from '../../../utils/trackDetails'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import getTrackDto from '../../../utils/mapping/track-extra-payload'
import { ICON_PRESS_STYLES } from '../../../configs/style.config'
import { useAlbum } from '../../../api/queries/album'

export default function SongInfo(): React.JSX.Element {
	const currentTrack = useCurrentTrack()

	const item = getTrackDto(currentTrack)

	const { data: album } = useAlbum(
		item && item.AlbumId ? ({ Id: item.AlbumId } as BaseItemDto) : ({} as BaseItemDto),
	)

	// Memoize expensive computations
	const trackTitle = currentTrack?.title ?? 'Untitled Track'

	const handleTrackPress = () => {
		navigationRef.goBack() // Dismiss player modal
		navigationRef.dispatch(CommonActions.navigate('Album', { album }))
	}

	const handleArtistPress = () => {
		if (item?.ArtistItems) {
			if (item.ArtistItems.length > 1) {
				navigationRef.dispatch(
					CommonActions.navigate('MultipleArtistsSheet', {
						artists: item.ArtistItems,
					}),
				)
			} else {
				navigationRef.goBack() // Dismiss player modal
				navigationRef.dispatch(
					CommonActions.navigate('Artist', { artist: item.ArtistItems[0] }),
				)
			}
		}
	}

	const openContextMenu = () =>
		currentTrack &&
		item &&
		navigationRef.navigate('Context', {
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
			<YStack justifyContent='flex-start' flex={1} gap={'$1'}>
				<Animated.View
					entering={FadeIn.easing(Easing.in(Easing.ease))}
					exiting={FadeOut.easing(Easing.out(Easing.ease))}
					key={`${currentTrack?.id ?? 'unknown-track'}-song-info`}
				>
					<TextTicker
						{...TextTickerConfig}
						key={`${currentTrack?.id ?? 'no-track'}-title`}
					>
						<Paragraph
							fontWeight={'$6'}
							fontSize={'$6'}
							onPress={handleTrackPress}
							{...ICON_PRESS_STYLES}
						>
							{trackTitle}
						</Paragraph>
					</TextTicker>

					<TextTicker
						{...TextTickerConfig}
						key={`${currentTrack?.id ?? 'no-track'}-artist`}
					>
						<Paragraph
							fontSize={'$6'}
							onPress={handleArtistPress}
							{...ICON_PRESS_STYLES}
						>
							{currentTrack?.artist ?? 'Unknown Artist'}
						</Paragraph>
						{isExplicit(item) && (
							<XStack alignSelf='center' paddingTop={5.3} paddingLeft='$1'>
								<Icon name='alpha-e-box-outline' color={'$color'} xsmall />
							</XStack>
						)}
					</TextTicker>
				</Animated.View>
			</YStack>

			<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap={'$3'}>
				<Icon name='dots-horizontal-circle-outline' onPress={openContextMenu} />

				{currentTrack && item && <FavoriteButton item={item} />}
			</XStack>
		</XStack>
	)
}
