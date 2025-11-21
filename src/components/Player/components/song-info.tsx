import TextTicker from 'react-native-text-ticker'
import { getToken, XStack, YStack } from 'tamagui'
import { TextTickerConfig } from '../component.config'
import { Text } from '../../Global/helpers/text'
import React, { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchItem } from '../../../api/queries/item'
import FavoriteButton from '../../Global/components/favorite-button'
import { QueryKeys } from '../../../enums/query-keys'
import navigationRef from '../../../../navigation'
import Icon from '../../Global/components/icon'
import { getItemName } from '../../../utils/text'
import { CommonActions } from '@react-navigation/native'
import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { usePrevious, useSkip } from '../../../providers/Player/hooks/mutations'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'
import { useCurrentTrack } from '../../../stores/player/queue'
import { useApi } from '../../../stores'

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

	const albumGesture = useMemo(
		() =>
			Gesture.Pan()
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
						(Math.abs(e.translationX) > threshold ||
							Math.abs(e.velocityX) > minVelocity)
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
				}),
		[previous, skip, trigger, x],
	)
	const nowPlaying = useCurrentTrack()

	const { data: album } = useQuery({
		queryKey: [QueryKeys.Album, nowPlaying!.item.AlbumId],
		queryFn: () => fetchItem(api, nowPlaying!.item.AlbumId!),
		enabled: !!nowPlaying?.item.AlbumId && !!api,
	})

	// Memoize expensive computations
	const trackTitle = useMemo(() => nowPlaying!.title ?? 'Untitled Track', [nowPlaying?.title])

	const { artistItems, artists } = useMemo(() => {
		return {
			artistItems: nowPlaying!.item.ArtistItems,
			artists: nowPlaying!.item.ArtistItems?.map((artist) => getItemName(artist)).join(' • '),
		}
	}, [nowPlaying?.item.ArtistItems])

	// Memoize navigation handlers
	const handleArtistPress = useCallback(() => {
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
	}, [artistItems])

	return (
		<XStack>
			<YStack justifyContent='flex-start' flex={1} gap={'$0.25'}>
				<TextTicker {...TextTickerConfig} style={{ height: getToken('$9') }}>
					<Text bold fontSize={'$6'}>
						{trackTitle}
					</Text>
				</TextTicker>

				<TextTicker {...TextTickerConfig} style={{ height: getToken('$8') }}>
					<Text fontSize={'$6'} color={'$color'} onPress={handleArtistPress}>
						{artists ?? 'Unknown Artist'}
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
