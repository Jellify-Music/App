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
import { getItemName } from '../../../utils/formatting/item-names'
import { CommonActions } from '@react-navigation/native'
import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { usePrevious, useSkip } from '../../../providers/Player/hooks/callbacks'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { useCurrentTrack } from '../../../stores/player/queue'
import { useApi } from '../../../stores'
import formatArtistNames from '../../../utils/formatting/artist-names'

type SongInfoProps = {
	// Shared animated value coming from Player to drive overlay icons
	swipeX?: SharedValue<number>
}

export default function SongInfo({ swipeX }: SongInfoProps = {}): React.JSX.Element {
	const api = useApi()
	const skip = useSkip()
	const previous = usePrevious()
	const trigger = useHapticFeedback()

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
					runOnJS(trigger)('notificationSuccess')
					runOnJS(skip)(undefined)
				} else {
					x.value = withSpring(-220)
					runOnJS(trigger)('notificationSuccess')
					runOnJS(previous)()
				}
				x.value = withDelay(160, withSpring(0))
			} else {
				x.value = withSpring(0)
			}
		})

	const nowPlaying = useCurrentTrack()

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
		enabled: !!nowPlaying?.item.AlbumId && !!api,
	})

	// Memoize expensive computations
	const trackTitle = nowPlaying!.title ?? 'Untitled Track'

	const { artistItems, artists } = {
		artistItems: nowPlaying!.item.ArtistItems,
		artists: formatArtistNames(
			nowPlaying!.item.ArtistItems?.map((artist) => getItemName(artist)) ?? [],
		),
	}

	const handleTrackPress = () => {
		navigationRef.goBack() // Dismiss player modal
		navigationRef.dispatch(CommonActions.navigate('Album', { album }))
	}

	const handleArtistPress = () => {
		if (artistItems) {
			if (artistItems.length > 1) {
				navigationRef.dispatch(
					CommonActions.navigate('MultipleArtistsSheet', {
						artists: artistItems,
					}),
				)
			} else {
				navigationRef.goBack() // Dismiss player modal
				navigationRef.dispatch(CommonActions.navigate('Artist', { artist: artistItems[0] }))
			}
		}
	}

	return (
		<XStack>
			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker
					{...TextTickerConfig}
					style={{ height: getToken('$9') }}
					key={`${nowPlaying!.item.Id}-title`}
				>
					<Text bold fontSize={'$6'} onPress={handleTrackPress}>
						{trackTitle}
					</Text>
				</TextTicker>

				<TextTicker
					{...TextTickerConfig}
					style={{ height: getToken('$8') }}
					key={`${nowPlaying!.item.Id}-artist`}
				>
					<Text fontSize={'$6'} color={'$color'} onPress={handleArtistPress}>
						{nowPlaying?.artist ?? 'Unknown Artist'}
					</Text>
				</TextTicker>
			</YStack>

			<XStack justifyContent='flex-end' alignItems='center' flexShrink={1} gap={'$3'}>
				<Icon
					name='dots-horizontal-circle-outline'
					onPress={() =>
						navigationRef.navigate('Context', {
							item: nowPlaying!.item,
							streamingMediaSourceInfo:
								nowPlaying!.sourceType === 'stream'
									? nowPlaying!.mediaSourceInfo
									: undefined,
							downloadedMediaSourceInfo:
								nowPlaying!.sourceType === 'download'
									? nowPlaying!.mediaSourceInfo
									: undefined,
						})
					}
				/>

				<FavoriteButton item={nowPlaying!.item} />
			</XStack>
		</XStack>
	)
}
