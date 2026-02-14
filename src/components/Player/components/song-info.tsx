import TextTicker from 'react-native-text-ticker'
import { getToken, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { Text } from '../../Global/helpers/text'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import FavoriteButton from '../../Global/components/favorite-button'
import { QueryKeys } from '../../../enums/query-keys'
import navigationRef from '../../../../navigation'
import Icon from '../../Global/components/icon'
import { CommonActions } from '@react-navigation/native'
import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { usePrevious, useSkip } from '../../../hooks/player/callbacks'
import { useCurrentTrack } from '../../../stores/player/queue'
import { useApi } from '../../../stores'
import { isExplicit } from '../../../utils/trackDetails'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'
import { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client'
import getTrackDto from '../../../utils/mapping/track-extra-payload'

type SongInfoProps = {
	// Shared animated value coming from Player to drive overlay icons
	swipeX?: SharedValue<number>
}

export default function SongInfo({ swipeX }: SongInfoProps = {}): React.JSX.Element {
	const api = useApi()
	const skip = useSkip()
	const previous = usePrevious()
	// local fallback if no shared value was provided
	const localX = useSharedValue(0)
	const x = swipeX ?? localX

	const albumGesture = Gesture.Pan()
		.activeOffsetX([-12, 12])
		.onUpdate((e) => {
			if (Math.abs(e.translationY) < 40) {
				x.value = Math.max(-160, Math.min(160, e.translationX))
			}
		})
		.onEnd((e) => {
			const threshold = 120
			const minVelocity = 600
			const isHorizontal = Math.abs(e.translationY) < 40
			if (
				isHorizontal &&
				(Math.abs(e.translationX) > threshold || Math.abs(e.velocityX) > minVelocity)
			) {
				if (e.translationX > 0) {
					x.value = withSpring(220)
					runOnJS(triggerHaptic)('notificationSuccess')
					runOnJS(skip)(undefined)
				} else {
					x.value = withSpring(-220)
					runOnJS(triggerHaptic)('notificationSuccess')
					runOnJS(previous)()
				}
				x.value = withDelay(160, withSpring(0))
			} else {
				x.value = withSpring(0)
			}
		})

	const currentTrack = useCurrentTrack()

	const item = getTrackDto(currentTrack)

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, item!.AlbumId!],
		queryFn: () => fetchItem(api, item!.AlbumId! as string),
		enabled: !!item && !!api,
	})

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
			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker
					{...TextTickerConfig}
					style={{ height: getToken('$9') }}
					key={`${currentTrack?.id ?? 'no-track'}-title`}
				>
					<Text bold fontSize={'$6'} onPress={handleTrackPress}>
						{trackTitle}
					</Text>
				</TextTicker>

				<TextTicker
					{...TextTickerConfig}
					style={{ height: getToken('$8') }}
					key={`${currentTrack?.id ?? 'no-track'}-artist`}
				>
					<Text fontSize={'$6'} color={'$color'} onPress={handleArtistPress}>
						{currentTrack?.artist ?? 'Unknown Artist'}
					</Text>
					{isExplicit(item) && (
						<XStack alignSelf='center' paddingTop={5.3} paddingLeft='$1'>
							<Icon name='alpha-e-box-outline' color={'$color'} xsmall />
						</XStack>
					)}
				</TextTicker>
			</YStack>

			<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap={'$3'}>
				<Icon name='dots-horizontal-circle-outline' onPress={openContextMenu} />

				{currentTrack && item && <FavoriteButton item={item} />}
			</XStack>
		</XStack>
	)
}
